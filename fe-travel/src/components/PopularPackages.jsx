import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PackageCard from './PackageCard';
import { popularPackages } from '../data/packageData';

const PopularPackages = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const handleViewMore = () => {
    navigate('/packages');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Popular Sri Lankan Travel Packages</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover the Pearl of the Indian Ocean with our most sought-after Sri Lankan vacation packages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularPackages.slice(0, 3).map((pkg) => (
          <div key={pkg.id} className="px-3 py-4">
            <PackageCard packageItem={pkg} />
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={handleViewMore}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View All Sri Lankan Destinations
        </button>
      </div>
    </div>
  );
};

export default PopularPackages;