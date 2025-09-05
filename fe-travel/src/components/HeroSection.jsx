import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleBookTourClick = () => {
    navigate('/packages');
  };

  return (
    <div className="relative w-full h-96 md:h-[32rem]">
      {/* Main image with blue gradient bottom border */}
      <div className="relative w-full h-full">
        <img 
          src="./banner.jpg" 
          alt="Hero Banner" 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Blue gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-600 to-transparent z-10"></div>
      </div>
      
      {/* Dark gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
      
      {/* Text content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in">
          Discover Your Next Adventure
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl drop-shadow-md animate-fade-in-delay">
          Explore breathtaking destinations with our expertly crafted tours
        </p>
        <button 
          onClick={handleBookTourClick}
          className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 animate-fade-in-delay-2 flex items-center gap-2"
          aria-label="Navigate to tour packages"
        >
          Book Your Tour Now
          <ArrowRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 1s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;