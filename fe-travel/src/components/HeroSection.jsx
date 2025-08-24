import React from 'react';

const HeroSection = () => {
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
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Discover Your Next Adventure
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl drop-shadow-md">
          Explore breathtaking destinations with our expertly crafted tours
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105">
          Book Your Tour Now
        </button>
      </div>
    </div>
  );
};

export default HeroSection;