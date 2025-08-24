import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon, HeartIcon } from '@heroicons/react/24/solid';
import { popularPackages } from '../data/packageData';

const PackageCard = ({ packageItem = {} }) => {
  const navigate = useNavigate();

  const {
    image = "https://via.placeholder.com/400x300?text=No+Image",
    title = "Package Title",
    location = "Unknown Location",
    region = "Unknown Region",
    rating = 0,
    reviews = 0,
    duration = "N/A",
    price = "$0",
    discountPrice = null,
    highlights = [],
    tags = [],
    isWishlisted = false
  } = packageItem;

  const handleBookNow = () => {
    // Calculate base price (remove currency symbols and convert to number)
    let basePrice;
    try {
      basePrice = discountPrice 
        ? parseFloat(discountPrice.replace(/[^0-9.-]+/g, "")) 
        : parseFloat(price.replace(/[^0-9.-]+/g, ""));
      
      if (isNaN(basePrice)) {
        throw new Error("Invalid price format");
      }
    } catch (error) {
      console.error("Error parsing price:", error);
      basePrice = 0; // Fallback to 0 if price parsing fails
    }

    navigate('/booking', {
      state: {
        package: packageItem,
        basePrice: basePrice
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 transform hover:-translate-y-1 h-full flex flex-col relative">
      <button className="absolute top-3 right-3 z-10 p-2 bg-white bg-opacity-80 rounded-full hover:bg-red-100 transition">
        <HeartIcon className={`h-5 w-5 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
      </button>

      <div className="relative pb-48 overflow-hidden">
        <img 
          className="absolute inset-0 h-full w-full object-cover" 
          src={image} 
          alt={title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
          }}
        />
        {tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span key={index} className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                tag === "Popular" ? 'bg-orange-500 text-white' :
                tag === "Limited" ? 'bg-red-500 text-white' :
                'bg-blue-600 text-white'
              }`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-baseline">
          <div className="flex items-center text-blue-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{location}</span>
          </div>
          <div className="ml-auto flex items-center text-yellow-500">
            <StarIcon className="h-5 w-5" />
            <span className="ml-1 text-gray-600">{rating.toFixed(1)} ({reviews})</span>
          </div>
        </div>
        
        <h3 className="mt-2 text-xl font-semibold text-gray-800">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 capitalize">{region}</p>
        
        <div className="mt-2 flex items-center text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">{duration}</span>
        </div>
        
        <div className="mt-4">
          {discountPrice ? (
            <>
              <span className="text-xl font-bold text-gray-900">{discountPrice}</span>
              <span className="ml-2 text-sm text-gray-500 line-through">{price}</span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">{price}</span>
          )}
          <span className="text-sm text-gray-500"> / person</span>
        </div>
        
        {highlights.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-800">Highlights:</h4>
            <ul className="mt-2 space-y-1">
              {highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <button 
            onClick={handleBookNow}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

const Packages = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">All Travel Packages</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Browse through all our available vacation packages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {popularPackages.map((pkg) => (
          <PackageCard key={pkg.id} packageItem={pkg} />
        ))}
      </div>
    </div>
  );
};

export default Packages;