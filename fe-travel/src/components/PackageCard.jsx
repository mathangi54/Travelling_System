import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon, HeartIcon, ClockIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const PackageCard = ({ packageItem = {}, onWishlistToggle, showError = false, isRecommended = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Default values and helpers
  const getDefaultValue = (value, fallback) => value !== undefined ? value : fallback;
  const getRandomDays = () => Math.floor(Math.random() * 14) + 1;
  // Updated price range: Rs. 4000 to Rs. 50000
  const getRandomPrice = () => Math.floor(Math.random() * 46000) + 4000;
  
  // Generate discount pricing (30-90% off)
  const generateDiscountPrice = (originalPrice) => {
    const discountPercent = Math.floor(Math.random() * 61) + 30; // 30-90% discount
    const discountedPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
    return Math.max(discountedPrice, 999); // Minimum price Rs. 999
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
    tour_type = packageItem.tour_type || "Adventure"
  } = packageItem;

  // Validate price is within range, if not, generate a new one
  const originalPrice = packageItem.price && packageItem.price >= 4000 && packageItem.price <= 50000 
    ? packageItem.price 
    : getRandomPrice();
  
  // Generate discount price if not provided (80% of packages will have discounts)
  const shouldHaveDiscount = !packageItem.discount_price && Math.random() < 0.8;
  let discountPrice = packageItem.discount_price;
  
  // If discount price exists, validate it's within range
  if (discountPrice && (discountPrice < 4000 || discountPrice > 50000)) {
    discountPrice = null; // Reset if outside range
  }
  
  // Generate discount price if needed and ensure it's within range
  if (!discountPrice && shouldHaveDiscount) {
    discountPrice = generateDiscountPrice(originalPrice);
  }
  
  // Final validation: ensure discount price is within range and less than original
  if (discountPrice && (discountPrice < 4000 || discountPrice >= originalPrice)) {
    discountPrice = null;
  }

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
      price: discountPrice || originalPrice,
      original_price: originalPrice,
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

  const discountPercentage = discountPrice
    ? Math.round((1 - discountPrice / originalPrice) * 100)
    : 0;

  const displayPrice = discountPrice || originalPrice;

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
            console.log(`Image failed to load: ${image_url}`);
            console.log('Trying fallback image...');
            e.target.src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop";
          }}
          onLoad={() => {
            console.log(`Image loaded successfully: ${image_url}`);
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
            {discountPrice ? (
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
                  Save {discountPercentage}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-blue-700">
                {formatPrice(displayPrice)}
              </span>
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