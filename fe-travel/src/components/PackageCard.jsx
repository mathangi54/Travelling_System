import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon, HeartIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const PackageCard = ({ packageItem = {}, onWishlistToggle, showError = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Default values and helpers
  const getDefaultValue = (value, fallback) => value !== undefined ? value : fallback;
  const getRandomDays = () => Math.floor(Math.random() * 14) + 1;
  const getRandomPrice = () => Math.floor(Math.random() * 2000) + 200;

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
    image = "https://via.placeholder.com/400x300?text=No+Image",
    name = "Package Title",
    description = "Package description",
    location = "Unknown Location",
    rating = getDefaultValue(packageItem.rating, (Math.random() * 4 + 1).toFixed(1)),
    reviews = getDefaultValue(packageItem.reviews, Math.floor(Math.random() * 1000)),
    duration_days = getDefaultValue(packageItem.duration_days, getRandomDays()),
    is_wishlisted = false,
    price = getDefaultValue(packageItem.price, getRandomPrice()),
    discount_price = packageItem.discount_price,
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
      image_url: image,
      is_wishlisted,
      packageType: 'standard',
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

  const formatPrice = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const discountPercentage = discount_price
    ? Math.round((1 - discount_price / price) * 100)
    : 0;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition h-full flex flex-col relative cursor-pointer"
      onClick={handleBookNow}
    >
      <button
        className="absolute top-3 right-3 z-10 p-2 bg-white bg-opacity-80 rounded-full hover:bg-red-100 transition"
        onClick={handleWishlistToggle}
        aria-label={is_wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <HeartIcon className={`h-5 w-5 ${is_wishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
      </button>

      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => (e.target.src = "https://via.placeholder.com/400x300?text=Image+Error")}
          loading="lazy"
        />
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{name}</h3>
          <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
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
            {discount_price ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">{formatPrice(discount_price)}</span>
                  <span className="text-base text-gray-500 line-through">{formatPrice(price)}</span>
                </div>
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-1">
                  Save {discountPercentage}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-blue-700">{formatPrice(price)}</span>
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