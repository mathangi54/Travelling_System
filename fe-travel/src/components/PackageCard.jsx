import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon, HeartIcon, ClockIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const PackageCard = ({ packageItem = {}, onWishlistToggle, showError = false, isRecommended = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [optimalPrice, setOptimalPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Default values and helpers
  const getDefaultValue = (value, fallback) => value !== undefined ? value : fallback;
  const getRandomDays = () => Math.floor(Math.random() * 14) + 1;
  const getRandomPrice = () => Math.floor(Math.random() * 46000) + 4000; // Prices between Rs. 4000 and Rs. 50,000

  useEffect(() => {
    // Fetch optimal price when component mounts if we have backend data
    if (packageItem.id && packageItem.price && !packageItem.discount_price) {
      calculateOptimalPrice();
    }
  }, [packageItem]);

  const calculateOptimalPrice = async () => {
    setIsLoadingPrice(true);
    try {
      // Use a future date for price calculation (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const travelDate = futureDate.toISOString().split('T')[0];
      
      const response = await fetch('http://localhost:5000/api/ai-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tour_id: packageItem.id,
          travel_date: travelDate,
          guests: 2
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOptimalPrice(data.data);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      console.log('AI pricing not available, using standard pricing');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  if (showError || !packageItem) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col items-center justify-center p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Tour Not Found</h3>
        <p className="text-gray-600 mb-4">The requested tour package could not be found.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    id = Math.random().toString(36).substring(2, 9),
    // Handle both 'image' and 'image_url' properties
    image_url = packageItem.image || packageItem.image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
    name = "Sri Lankan Package",
    description = "Discover the beauty of Sri Lanka",
    location = "Sri Lanka",
    rating = getDefaultValue(packageItem.rating, (Math.random() * 4 + 1).toFixed(1)),
    reviews = getDefaultValue(packageItem.reviews, Math.floor(Math.random() * 1000)),
    duration_days = getDefaultValue(packageItem.duration_days, getRandomDays()),
    is_wishlisted = false,
    price = getDefaultValue(packageItem.price, getRandomPrice()),
    discount_price = packageItem.discount_price,
    tour_type = packageItem.tour_type || "Adventure"
  } = packageItem;

  const handleBookNow = (e) => {
    e.stopPropagation();
    const bookingData = {
      id,
      name,
      description,
      location,
      rating: parseFloat(rating),
      reviews,
      duration_days,
      price: discount_price || price,
      original_price: price,
      image_url,
      is_wishlisted,
      packageType: 'standard',
      tour_type
    };

    localStorage.removeItem('currentBooking');
    localStorage.setItem('currentBooking', JSON.stringify(bookingData));

    navigate('/booking', {
      state: {
        package: bookingData,
        timestamp: Date.now(),
      },
    });
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    onWishlistToggle?.(id, !is_wishlisted);
  };

  const formatPrice = (amount) => {
    if (!amount) return 'Rs. 0';
    return `Rs. ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
  };

  const discountPercentage = discount_price
    ? Math.round((1 - discount_price / price) * 100)
    : 0;

  const displayPrice = optimalPrice?.final_price || (discount_price || price);
  const originalPrice = optimalPrice?.base_price || price;

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition h-full flex flex-col relative cursor-pointer ${
        isRecommended ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleBookNow}
    >
      {isRecommended && (
        <div className="absolute top-3 left-3 z-10 flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          <SparklesIcon className="h-4 w-4 mr-1" />
          Recommended
        </div>
      )}
      
      <button
        className="absolute top-3 right-3 z-10 p-2 bg-white bg-opacity-80 rounded-full hover:bg-red-100 transition"
        onClick={handleWishlistToggle}
        aria-label={is_wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <HeartIcon className={`h-5 w-5 ${is_wishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
      </button>

      <div className="relative h-48 overflow-hidden">
        <img
          src={image_url}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop";
          }}
          loading="lazy"
        />
        {tour_type && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            {tour_type}
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{name}</h3>
          <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 ml-2">
            <ClockIcon className="h-4 w-4" />
            {duration_days} {duration_days === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="flex items-center text-blue-600 mb-2">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{location}</span>
        </div>

        <p className="text-gray-600 mb-4 flex-grow line-clamp-2">{description}</p>

        <div className="flex items-center text-yellow-500 mb-4">
          <StarIcon className="h-5 w-5" />
          <span className="ml-1 text-gray-600">
            {rating} ({reviews > 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews} reviews)
          </span>
        </div>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            {discount_price || (optimalPrice && optimalPrice.final_price !== originalPrice) ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">
                    {formatPrice(displayPrice)}
                  </span>
                  <span className="text-base text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-1">
                  {discount_price 
                    ? `Save ${discountPercentage}%` 
                    : 'AI Optimized Price'
                  }
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-blue-700">
                  {isLoadingPrice ? 'Calculating...' : formatPrice(displayPrice)}
                </span>
                {optimalPrice && (
                  <span className="text-xs text-gray-500">
                    AI optimized pricing
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleBookNow}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;