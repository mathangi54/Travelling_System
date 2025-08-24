import React from 'react';

const Guides = () => {
  // Sample guide data
  const guides = [
    {
      id: 1,
      name: 'Sarah Johnson',
      specialty: 'Historical Tours',
      experience: '8 years',
      rating: 4.9,
      languages: ['English', 'Spanish', 'French'],
      image: '/images/guide1.jpg',
      bio: 'Certified historian with deep knowledge of local architecture and cultural heritage.',
      tours: 245
    },
    {
      id: 2,
      name: 'Raj Patel',
      specialty: 'Adventure Expeditions',
      experience: '6 years',
      rating: 4.8,
      languages: ['English', 'Hindi', 'Gujarati'],
      image: '/images/guide2.jpg',
      bio: 'Outdoor enthusiast with wilderness first responder certification and mountain climbing expertise.',
      tours: 180
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      specialty: 'Culinary Tours',
      experience: '5 years',
      rating: 4.95,
      languages: ['English', 'Spanish', 'Italian'],
      image: '/images/guide3.jpg',
      bio: 'Former chef who loves sharing local food traditions and hidden gastronomic gems.',
      tours: 210
    },
    {
      id: 4,
      name: 'James Wilson',
      specialty: 'Wildlife Safaris',
      experience: '10 years',
      rating: 4.85,
      languages: ['English', 'Swahili'],
      image: '/images/guide4.jpg',
      bio: 'Zoology graduate with extensive knowledge of local ecosystems and animal behavior.',
      tours: 320
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Meet Our Expert Guides
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Professional, knowledgeable, and passionate about sharing their love for travel.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              <div className="relative pb-48 overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src={guide.image}
                  alt={guide.name}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{guide.name}</h2>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-gray-600">
                      {guide.rating} ({guide.tours}+ tours)
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-indigo-600 font-medium">{guide.specialty}</p>
                
                <div className="mt-4">
                  <p className="text-gray-600">{guide.bio}</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">Experience</h3>
                  <p className="text-sm text-gray-600">{guide.experience}</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">Languages</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {guide.languages.map((language, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Our Guides?</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-indigo-600">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Certified Professionals</h3>
              <p className="mt-2 text-gray-600">
                All guides undergo rigorous training and certification processes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-indigo-600">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Local Expertise</h3>
              <p className="mt-2 text-gray-600">
                Deep knowledge of local culture, history, and hidden gems.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-indigo-600">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Flexible Scheduling</h3>
              <p className="mt-2 text-gray-600">
                Available for private tours at times that work for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guides;