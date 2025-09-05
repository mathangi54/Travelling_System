import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Discover Sri Lanka's Hidden Treasures
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Experience the Pearl of the Indian Ocean with our expertly crafted tours and authentic Sri Lankan adventures.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            We are passionate about showcasing Sri Lanka's incredible diversity - from ancient kingdoms to pristine beaches, misty mountains to vibrant wildlife. Our mission is to provide authentic, sustainable, and transformative travel experiences that connect you with the soul of Sri Lanka.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Cultural Heritage</h3>
              <p className="text-gray-600">
                Explore 2,500 years of history through ancient temples, royal palaces, and UNESCO World Heritage sites.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-800 mb-3">Natural Wonders</h3>
              <p className="text-gray-600">
                From tea plantations in the hills to leopards in Yala, experience Sri Lanka's incredible biodiversity.
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-800 mb-3">Local Expertise</h3>
              <p className="text-gray-600">
                Our guides are born and raised in Sri Lanka, sharing insider knowledge and authentic local stories.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Experiences Section */}
      <div className="max-w-7xl mx-auto mb-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-6">Authentic Sri Lankan Experiences</h2>
        <ul className="space-y-4">
          {[
            "Sunrise climb to Adam's Peak (Sri Pada) for breathtaking mountain views",
            "Traditional Ceylon tea tasting in Nuwara Eliya's historic plantations",
            "Whale watching tours in Mirissa during migration season",
            "Cultural village experiences with traditional cooking classes",
            "Safari adventures to spot the elusive Sri Lankan leopard",
            "Stilt fishing demonstrations and fresh seafood dining in coastal villages",
            "Ancient temple visits with Buddhist monks and meditation sessions",
            "Spice garden tours learning about Sri Lanka's famous cinnamon and cardamom",
          ].map((item, index) => (
            <li key={index} className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-1 text-yellow-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why Sri Lanka Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">Why Choose Sri Lanka?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">8 UNESCO Sites</h3>
              <p className="text-gray-600 text-sm">Rich cultural and natural heritage</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🐆</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Wildlife Paradise</h3>
              <p className="text-gray-600 text-sm">Highest leopard density in Asia</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏖️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">1,340km Coast</h3>
              <p className="text-gray-600 text-sm">Pristine beaches all year round</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍃</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ceylon Tea</h3>
              <p className="text-gray-600 text-sm">World's finest tea since 1867</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Explore Sri Lanka?</h2>
        <p className="text-gray-600 mb-6">Join us for an unforgettable journey through the Pearl of the Indian Ocean</p>
        <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Start Your Sri Lankan Adventure
        </button>
      </div>
    </div>
  );
};

export default About;