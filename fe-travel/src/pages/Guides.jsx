import React from 'react';

const Guides = () => {
  // Sample guide data with Sri Lankan context
  const guides = [
    {
      id: 1,
      name: 'Chaminda Perera',
      specialty: 'Cultural Heritage Tours',
      experience: '12 years',
      rating: 4.9,
      languages: ['English', 'Sinhala', 'Tamil'],
      image: 'https://images.unsplash.com/photo-1535077761702-4934a0669af9?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      bio: 'Born in Kandy, expert in Buddhist history and UNESCO World Heritage sites. Specializes in Cultural Triangle tours.',
      tours: 485,
      specialities: ['Sigiriya & Dambulla', 'Kandy Temple Tours', 'Ancient Kingdoms']
    },
    {
      id: 2,
      name: 'Nimal Fernando',
      specialty: 'Wildlife & Nature Tours',
      experience: '15 years',
      rating: 4.95,
      languages: ['English', 'Sinhala', 'German'],
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Wildlife biologist and safari guide with deep knowledge of Yala, Udawalawe and leopard behavior patterns.',
      tours: 520,
      specialities: ['Leopard Safaris', 'Elephant Watching', 'Bird Photography']
    },
    {
      id: 3,
      name: 'Priya Wickramasinghe',
      specialty: 'Tea Country & Hill Station Tours',
      experience: '8 years',
      rating: 4.88,
      languages: ['English', 'Sinhala', 'French'],
      image: 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      bio: 'Tea plantation heritage expert from Nuwara Eliya, specializing in Ceylon tea history and hill country adventures.',
      tours: 320,
      specialities: ['Tea Factory Tours', 'Ella & Nine Arches', 'Mountain Trekking']
    },
    {
      id: 4,
      name: 'Ruwan Jayasuriya',
      specialty: 'Coastal & Adventure Tours',
      experience: '10 years',
      rating: 4.92,
      languages: ['English', 'Sinhala', 'Japanese'],
      image: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      bio: 'Certified diving instructor and marine conservation advocate. Expert in southern coast attractions and whale watching.',
      tours: 410,
      specialities: ['Whale Watching', 'Surfing Lessons', 'Coastal Heritage']
    },
    {
      id: 5,
      name: 'Kumari Silva',
      specialty: 'Culinary & Village Tours',
      experience: '6 years',
      rating: 4.87,
      languages: ['English', 'Sinhala', 'Tamil'],
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      bio: 'Traditional Sri Lankan chef and cultural ambassador. Offers authentic village experiences and cooking classes.',
      tours: 285,
      specialities: ['Spice Garden Tours', 'Traditional Cooking', 'Village Experiences']
    },
    {
      id: 6,
      name: 'Mahinda Rathnayake',
      specialty: 'Adventure & Pilgrimage Tours',
      experience: '14 years',
      rating: 4.91,
      languages: ['English', 'Sinhala', 'Hindi'],
      image: 'https://images.unsplash.com/photo-1517308883849-ceac3c24681e?q=80&w=686&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      bio: 'Mountain guide and meditation practitioner. Specializes in Adam\'s Peak pilgrimages and spiritual journeys.',
      tours: 465,
      specialities: ['Adam\'s Peak Climb', 'Meditation Retreats', 'Sacred Sites']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Meet Our Sri Lankan Guides
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-600">
            Local experts passionate about sharing Sri Lanka's rich heritage, stunning nature, and warm hospitality.
          </p>
          <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Licensed & Certified
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Born & Raised Locally
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              4.8+ Star Rating
            </div>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="relative pb-64 overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  src={guide.image}
                  alt={guide.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{guide.rating}</span>
                    <span className="text-xs ml-2 opacity-90">({guide.tours} tours)</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{guide.name}</h2>
                    <p className="text-sm text-indigo-600 font-medium">{guide.specialty}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    {guide.experience}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{guide.bio}</p>
                </div>

                {/* Specialities */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Specialities</h3>
                  <div className="flex flex-wrap gap-1">
                    {guide.specialities.map((speciality, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                        {speciality}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Languages */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {guide.languages.map((language, index) => (
                      <span key={index} className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Book Tour
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why Choose Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Sri Lankan Guides?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our guides don't just show you Sri Lanka – they share their homeland with authentic stories, insider knowledge, and genuine warmth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sri Lanka Tourism Board Certified</h3>
              <p className="text-gray-600 text-sm">
                All guides are licensed and regularly trained by the official tourism board.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Born & Raised Locally</h3>
              <p className="text-gray-600 text-sm">
                Deep-rooted knowledge of hidden gems, local customs, and family traditions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellent Reviews</h3>
              <p className="text-gray-600 text-sm">
                Average 4.8+ star ratings from thousands of satisfied international visitors.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible & Personal</h3>
              <p className="text-gray-600 text-sm">
                Customizable itineraries and personal attention to your interests and pace.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Explore Sri Lanka with a Local Expert?</h2>
          <p className="text-lg mb-6 opacity-90">
            Connect with one of our certified guides and discover the real Sri Lanka beyond the guidebooks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Browse All Tours
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors">
              Request Custom Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guides;