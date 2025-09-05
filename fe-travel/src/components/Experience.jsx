import React from 'react';
import { FiAward, FiUsers, FiStar } from 'react-icons/fi';

const Experience = () => {
  // Only 3 main experience stats
  const stats = [
    {
      id: 1,
      icon: <FiAward className="w-6 h-6" />,
      number: "15+",
      title: "Years of Excellence",
      description: "Authenticity since 2008",
      color: "text-amber-500",
      bg: "bg-amber-50",
      gradient: "from-amber-400 to-orange-500"
    },
    {
      id: 2,
      icon: <FiUsers className="w-6 h-6" />,
      number: "10K+",
      title: "Happy Customers",
      description: "Satisfied guests and counting",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      id: 3,
      icon: <FiStar className="w-6 h-6" />,
      number: "4.9",
      title: "Rating Score",
      description: "Based on customer reviews",
      color: "text-purple-500",
      bg: "bg-purple-50",
      gradient: "from-purple-400 to-indigo-500"
    }
  ];

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-400"></div>
      
      {/* Floating background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/4 w-24 h-24 bg-gradient-to-br from-purple-200 to-indigo-300 rounded-full opacity-25 animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-4 shadow-sm">
            <FiStar className="w-4 h-4" />
            Our Legacy
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            A Decade of Culinary 
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Excellence</span>
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            We take pride in our journey, our craft, and the countless smiles we've created along the way.
          </p>
        </div>

        {/* Stats Grid - 3 cards only */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="group relative"
              style={{ height: '220px' }}
            >
              {/* Card with exact fixed height */}
              <div 
                className="relative w-full p-6 rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2"
                style={{ height: '220px', display: 'flex', flexDirection: 'column' }}
              >
                {/* Gradient border effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-xl opacity-0 group-hover:opacity-8 transition-opacity duration-300`}></div>
                
                {/* Icon container */}
                <div className="flex justify-center" style={{ height: '70px', alignItems: 'center' }}>
                  <div className={`relative w-14 h-14 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
                
                {/* Number */}
                <div className="text-4xl font-bold text-gray-900 text-center" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.number}
                </div>
                
                {/* Title */}
                <div className="text-xl font-semibold text-gray-900 text-center leading-tight" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                  {stat.title}
                </div>
                
                {/* Description */}
                <div className="text-sm text-gray-600 text-center leading-relaxed" style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                  {stat.description}
                </div>
                
                {/* Bottom accent line */}
                <div className="flex justify-center" style={{ height: '10px', alignItems: 'center' }}>
                  <div className={`h-1 w-20 bg-gradient-to-r ${stat.gradient} rounded-full opacity-70`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <FiStar className="w-5 h-5" />
            <span className="font-semibold text-lg">Experience the Difference</span>
          </div>
        </div>
      </div>

      {/* Enhanced floating decorations */}
      <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute -right-32 -top-32 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
    </section>
  );
};

export default Experience;