import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          About Our Travel Adventures
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Discover the world with our expertly crafted tours and unforgettable experiences.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            We believe travel should be transformative, inspiring, and accessible. Our mission is to connect you with the most breathtaking destinations while ensuring sustainability and authenticity.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Tailored Packages</h3>
              <p className="text-gray-600">
                Customized tours for solo travelers, couples, and groups.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-800 mb-3">Unique Experiences</h3>
              <p className="text-gray-600">
                From hidden gems to iconic landmarks, we curate the best.
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-800 mb-3">Local Expertise</h3>
              <p className="text-gray-600">
                Guides who know the culture, history, and secrets of each destination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations (Places) */}
      <div className="max-w-7xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Explore Our Top Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: "Bali, Indonesia", desc: "Tropical paradise with lush jungles and beaches." },
            { name: "Kyoto, Japan", desc: "Ancient temples and cherry blossoms." },
            { name: "Santorini, Greece", desc: "White-washed villages and crystal-clear waters." },
          ].map((place, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{place.name}</h3>
                <p className="text-gray-600">{place.desc}</p>
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                  View Packages
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiences Section */}
      <div className="max-w-7xl mx-auto mb-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-6">Unforgettable Experiences</h2>
        <ul className="space-y-4">
          {[
            "Private guided tours of UNESCO World Heritage Sites",
            "Culinary adventures with local chefs",
            "Sunset cruises and wildlife safaris",
            "Cultural immersion with indigenous communities",
          ].map((item, index) => (
            <li key={index} className="flex items-start">
              <svg className="h-6 w-6 mr-2 mt-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready for Your Next Adventure?</h2>
        <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Contact Us Today
        </button>
      </div>
    </div>
  );
};

export default About;