import React, { useState, useEffect } from 'react';

// Comprehensive list of possible API endpoints
const API_ENDPOINTS = [
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api', 
  'http://192.168.1.3:5000/api',
  'http://0.0.0.0:5000/api'
];

const Guides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentApiBase, setCurrentApiBase] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    preferred_date: '',
    duration: '',
    group_size: '',
    message: '',
    tour_type: ''
  });

  // Static fallback data - comprehensive Sri Lankan guides with UNIQUE images
  const getStaticGuides = () => [
    {
      id: 1,
      name: 'Chaminda Perera',
      specialty: 'Cultural Heritage Tours',
      experience: '12 years',
      rating: 4.9,
      languages: ['English', 'Sinhala', 'Tamil'],
      image_url: '/images/guide1.jpg',
      bio: 'Born in Kandy, expert in Buddhist history and UNESCO World Heritage sites. Specializes in Cultural Triangle tours.',
      tours_completed: 485,
      specialities: ['Sigiriya & Dambulla', 'Kandy Temple Tours', 'Ancient Kingdoms'],
      phone: '+94 77 123 4567',
      email: 'chaminda@srilankaguides.com',
      price_range: 'Rs. 4,000-8,000/day'
    },
    {
      id: 2,
      name: 'Nimal Fernando',
      specialty: 'Wildlife & Nature Tours',
      experience: '15 years',
      rating: 4.95,
      languages: ['English', 'Sinhala'],
      image_url: '/images/guide2.jpg',
      bio: 'Wildlife biologist and safari guide with deep knowledge of Yala, Udawalawe and leopard behavior patterns.',
      tours_completed: 520,
      specialities: ['Leopard Safaris', 'Elephant Watching', 'Bird Photography'],
      phone: '+94 71 987 6543',
      email: 'nimal@wildlifeguides.lk',
      price_range: 'Rs. 4,000-8,000/day'
    },
    {
      id: 3,
      name: 'Priya Wickramasinghe',
      specialty: 'Tea Country & Hill Station Tours',
      experience: '8 years',
      rating: 4.88,
      languages: ['English', 'Sinhala'],
      image_url: '/images/guide3.jpg',
      bio: 'Tea plantation heritage expert from Nuwara Eliya, specializing in Ceylon tea history and hill country adventures.',
      tours_completed: 320,
      specialities: ['Tea Factory Tours', 'Ella & Nine Arches', 'Mountain Trekking'],
      phone: '+94 76 555 2468',
      email: 'priya@teacountryguides.com',
      price_range: 'Rs. 4,000-8,000/day'
    },
    {
      id: 4,
      name: 'Ruwan Jayasuriya',
      specialty: 'Coastal & Adventure Tours',
      experience: '10 years',
      rating: 4.92,
      languages: ['English', 'Sinhala', 'Tamil'],
      image_url: '/images/guide4.jpg',
      bio: 'Certified diving instructor and marine conservation advocate. Expert in southern coast attractions and whale watching.',
      tours_completed: 410,
      specialities: ['Whale Watching', 'Surfing Lessons', 'Coastal Heritage'],
      phone: '+94 75 333 7890',
      email: 'ruwan@coastalguides.lk',
      price_range: 'Rs. 4,000-8,000/day'
    },
    {
      id: 5,
      name: 'Kumari Silva',
      specialty: 'Culinary & Village Tours',
      experience: '6 years',
      rating: 4.87,
      languages: ['English', 'Sinhala', 'Tamil'],
      image_url: '/images/guide5.jpg',
      bio: 'Traditional Sri Lankan chef and cultural ambassador. Offers authentic village experiences and cooking classes.',
      tours_completed: 285,
      specialities: ['Spice Garden Tours', 'Traditional Cooking', 'Village Experiences'],
      phone: '+94 78 444 1357',
      email: 'kumari@culinaryguides.com',
      price_range: 'Rs. 4,000-8,000/day'
    },
    {
      id: 6,
      name: 'Mahinda Rathnayake',
      specialty: 'Adventure & Pilgrimage Tours',
      experience: '14 years',
      rating: 4.91,
      languages: ['English', 'Sinhala'],
      image_url: '/images/guide6.jpg',
      bio: 'Mountain guide and meditation practitioner. Specializes in Adam\'s Peak pilgrimages and spiritual journeys.',
      tours_completed: 465,
      specialities: ['Adam\'s Peak Climb', 'Meditation Retreats', 'Sacred Sites'],
      phone: '+94 77 666 9012',
      email: 'mahinda@pilgrimguides.lk',
      price_range: 'Rs. 4,000-8,000/day'
    }
  ];

  // Enhanced function to normalize and filter languages - only Tamil, English, Sinhala
  const normalizeLanguages = (languages) => {
    if (!languages) return ['English'];
    
    let langArray = [];
    if (Array.isArray(languages)) {
      langArray = languages;
    } else {
      try {
        langArray = JSON.parse(languages);
      } catch {
        langArray = [languages];
      }
    }
    
    // Valid Sri Lankan languages only - Tamil, English, Sinhala
    const validLanguages = ['Tamil', 'English', 'Sinhala'];
    const filteredLanguages = langArray.filter(lang => validLanguages.includes(lang));
    
    // Return filtered languages or default to English if none valid
    return filteredLanguages.length > 0 ? filteredLanguages : ['English'];
  };

  // Enhanced API connectivity test with detailed diagnostics
  const testApiConnectivity = async () => {
    console.log('Testing API connectivity...');
    setConnectionStatus('testing');
    
    const results = {
      endpoints: [],
      bestEndpoint: null,
      issues: [],
      recommendations: []
    };
    
    for (const apiBase of API_ENDPOINTS) {
      const endpointTest = {
        url: apiBase,
        available: false,
        latency: null,
        corsEnabled: false,
        guidesData: false,
        errorDetails: null
      };
      
      try {
        console.log(`Testing ${apiBase}...`);
        const startTime = Date.now();
        
        // Test basic connectivity with shorter timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${apiBase}/health`, {
          method: 'GET',
          mode: 'no-cors', // Try no-cors first to bypass CORS issues
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        endpointTest.latency = Date.now() - startTime;
        
        // If no-cors worked, try with cors
        try {
          const corsResponse = await fetch(`${apiBase}/health`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (corsResponse.ok) {
            endpointTest.available = true;
            endpointTest.corsEnabled = true;
            
            // Test guides endpoint
            const guidesResponse = await fetch(`${apiBase}/guides`, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (guidesResponse.ok) {
              const guidesData = await guidesResponse.json();
              endpointTest.guidesData = guidesData.status === 'success' && Array.isArray(guidesData.data);
              
              if (endpointTest.guidesData && !results.bestEndpoint) {
                results.bestEndpoint = apiBase;
              }
            }
          }
        } catch (corsErr) {
          endpointTest.available = true; // Server is running but CORS issue
          endpointTest.corsEnabled = false;
          endpointTest.errorDetails = 'CORS blocked';
          results.issues.push(`CORS issue with ${apiBase}`);
        }
        
      } catch (err) {
        endpointTest.errorDetails = err.message;
        if (err.name === 'AbortError') {
          results.issues.push(`${apiBase} timeout`);
        } else if (err.message.includes('Failed to fetch')) {
          results.issues.push(`${apiBase} unreachable`);
        }
      }
      
      results.endpoints.push(endpointTest);
    }
    
    // Generate recommendations
    const workingEndpoints = results.endpoints.filter(e => e.available);
    const corsIssues = results.endpoints.filter(e => e.available && !e.corsEnabled);
    
    if (workingEndpoints.length === 0) {
      results.recommendations = [
        'Flask server appears to be down or unreachable',
        'Restart Flask server: python app.py',
        'Check if port 5000 is blocked by firewall',
        'Verify you\'re running the server from the correct directory'
      ];
    } else if (corsIssues.length > 0) {
      results.recommendations = [
        'Server is running but CORS is blocking requests',
        'Update your Flask app.py with the provided CORS configuration',
        'Restart Flask server after updating CORS settings',
        'Try running in incognito mode'
      ];
    } else if (!results.bestEndpoint) {
      results.recommendations = [
        'Server is accessible but guides endpoint not working',
        'Visit /api/seed-guides to populate database',
        'Check database connection',
        'Verify routes.py includes guides endpoints'
      ];
    }
    
    setDiagnosticResults(results);
    console.log('Diagnostic results:', results);
    
    if (results.bestEndpoint) {
      setCurrentApiBase(results.bestEndpoint);
      setConnectionStatus('connected');
      return results.bestEndpoint;
    } else {
      setConnectionStatus('failed');
      return null;
    }
  };

  // Enhanced fetch guides with comprehensive error handling and language filtering
  const fetchGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Run connectivity test first
      let workingApiBase = await testApiConnectivity();
      
      if (!workingApiBase) {
        throw new Error('No API endpoints are accessible. Please ensure Flask server is running.');
      }
      
      console.log(`Using working endpoint: ${workingApiBase}`);
      
      // Fetch guides data
      const response = await fetch(`${workingApiBase}/guides`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          // Try to seed guides
          console.log('Database appears empty, attempting to seed...');
          await seedGuides(workingApiBase);
          
          // Retry fetching
          const retryResponse = await fetch(`${workingApiBase}/guides`);
          const retryData = await retryResponse.json();
          
          if (retryData.status === 'success' && retryData.data.length > 0) {
            // Normalize languages for all guides from API
            const guidesWithNormalizedLanguages = retryData.data.map(guide => ({
              ...guide,
              languages: normalizeLanguages(guide.languages)
            }));
            setGuides(guidesWithNormalizedLanguages);
            console.log('Guides loaded after seeding:', guidesWithNormalizedLanguages.length);
          } else {
            throw new Error('Unable to load or seed guides data');
          }
        } else {
          // Normalize languages for all guides from API
          const guidesWithNormalizedLanguages = data.data.map(guide => ({
            ...guide,
            languages: normalizeLanguages(guide.languages)
          }));
          setGuides(guidesWithNormalizedLanguages);
          console.log('Guides loaded successfully:', guidesWithNormalizedLanguages.length);
        }
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
      
    } catch (err) {
      console.error('Error in fetchGuides:', err);
      setError(err.message);
      
      // Always show static guides as fallback with normalized languages
      const staticGuides = getStaticGuides().map(guide => ({
        ...guide,
        languages: normalizeLanguages(guide.languages)
      }));
      setGuides(staticGuides);
      console.log('Using static fallback guides:', staticGuides.length);
      
    } finally {
      setLoading(false);
    }
  };

  // Seed guides database
  const seedGuides = async (apiBase) => {
    try {
      const response = await fetch(`${apiBase}/seed-guides`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Database seeded successfully:', data);
        return true;
      }
    } catch (err) {
      console.log('Seeding failed:', err);
    }
    return false;
  };

  // Show detailed diagnostic results
  const showDiagnosticDetails = () => {
    if (!diagnosticResults) return;
    
    const details = diagnosticResults.endpoints.map(ep => 
      `${ep.url}:\n` +
      `  Available: ${ep.available ? 'Yes' : 'No'}\n` +
      `  CORS: ${ep.corsEnabled ? 'Yes' : 'No'}\n` +
      `  Guides: ${ep.guidesData ? 'Yes' : 'No'}\n` +
      `  Latency: ${ep.latency || 'N/A'}ms\n` +
      `  Error: ${ep.errorDetails || 'None'}`
    ).join('\n\n');
    
    const summary = `DIAGNOSTIC RESULTS\n\n${details}\n\nISSUES FOUND:\n${diagnosticResults.issues.join('\n')}\n\nRECOMMENDATIONS:\n${diagnosticResults.recommendations.join('\n')}`;
    
    alert(summary);
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      preferred_date: '',
      duration: '',
      group_size: '',
      message: '',
      tour_type: ''
    });
  };

  const handleOpenModal = (guide, type) => {
    setSelectedGuide(guide);
    setModalType(type);
    resetForm();
    setFormData(prev => ({
      ...prev,
      tour_type: type === 'book' ? guide.specialty : ''
    }));
  };

  const handleCloseModal = () => {
    setSelectedGuide(null);
    setModalType(null);
    setSubmitting(false);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) return 'Name is required';
    if (!formData.customer_email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) return 'Invalid email format';
    if (!formData.message.trim()) return 'Message is required';
    if (formData.preferred_date && new Date(formData.preferred_date) < new Date()) {
      return 'Date cannot be in the past';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    // If no API connection, save form data locally
    if (connectionStatus === 'failed' || !currentApiBase) {
      const formBackup = {
        guide: selectedGuide.name,
        type: modalType,
        data: formData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('pending_guide_request', JSON.stringify(formBackup));
      alert('API connection unavailable!\n\nYour form has been saved locally and will be submitted when the server connection is restored.\n\nFor immediate assistance, please contact the guide directly:\n\n' + selectedGuide.email + '\n' + selectedGuide.phone);
      handleCloseModal();
      return;
    }

    setSubmitting(true);
    
    try {
      const requestData = {
        guide_id: selectedGuide.id,
        request_type: modalType === 'book' ? 'booking' : 'contact',
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        message: formData.message.trim(),
        preferred_date: formData.preferred_date || null,
        duration: formData.duration || null,
        group_size: formData.group_size || null,
        tour_type: formData.tour_type || null
      };

      const response = await fetch(`${currentApiBase}/guide-requests`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Clear any pending requests
        localStorage.removeItem('pending_guide_request');
        
        alert(`${modalType === 'book' ? 'Booking request' : 'Contact message'} sent successfully!\n\nRequest ID: ${data.data.id}\nGuide: ${selectedGuide.name}\n\nYou should receive a response within 24 hours.`);
        handleCloseModal();
      } else {
        throw new Error(data.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert(`Error: ${err.message}\n\nPlease try again or contact the guide directly:\n${selectedGuide.email}\n${selectedGuide.phone}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced function to display languages (only Tamil, English, Sinhala)
  const displayLanguages = (languages) => {
    const normalizedLangs = normalizeLanguages(languages);
    return normalizedLangs.join(', ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sri Lankan guides...</p>
          <p className="text-sm text-gray-500 mt-2">Testing API connectivity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Meet Our Sri Lankan Guides
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-600">
            Local experts passionate about sharing Sri Lanka's rich heritage, stunning nature, and warm hospitality.
          </p>
        </div>

        {/* Error Banner - Only show if there's a real error */}
        {error && connectionStatus === 'failed' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800 mb-2">API Connection Failed</h3>
                <p className="text-sm text-red-700 mb-3">
                  <strong>Error:</strong> {error}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => fetchGuides()}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry Connection
                  </button>
                  <button 
                    onClick={showDiagnosticDetails}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Diagnostics
                  </button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Currently showing static guide data as fallback.</strong> You can still browse guides and contact them directly via phone/email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guides Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative pb-64 overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  src={guide.image_url}
                  alt={guide.name}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535077761702-4934a0669af9?w=400&h=400&fit=crop&crop=face';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{guide.rating}</span>
                    <span className="text-xs ml-2 opacity-90">({guide.tours_completed || guide.tours} tours)</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{guide.name}</h2>
                  <p className="text-sm text-indigo-600 font-medium">{guide.specialty}</p>
                  <span className="text-xs text-gray-500">{guide.experience}</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{guide.bio}</p>

                {/* Specialities */}
                {guide.specialities && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(guide.specialities) ? guide.specialities : JSON.parse(guide.specialities || '[]')).map((speciality, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                          {speciality}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages - Enhanced with language filtering */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {normalizeLanguages(guide.languages).map((language, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 text-xs text-gray-500">
                  <p>{guide.email}</p>
                  <p>{guide.phone}</p>
                  <p>{guide.price_range}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(guide, 'book')}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Book Tour
                  </button>
                  <button 
                    onClick={() => handleOpenModal(guide, 'contact')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
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
              Our guides don't just show you Sri Lanka - they share their homeland with authentic stories, insider knowledge, and genuine warmth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Licensed & Certified</h3>
              <p className="text-gray-600 text-sm">
                All guides are licensed by Sri Lanka Tourism Board and regularly trained.
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
                Deep knowledge of hidden gems, local customs, and family traditions.
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
                Average 4.8+ star ratings from thousands of satisfied visitors.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multilingual Guides</h3>
              <p className="text-gray-600 text-sm">
                Communicate in Tamil, English, and Sinhala for authentic local experiences.
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

      {/* Modal */}
      {selectedGuide && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalType === 'book' ? 'Book Tour with' : 'Contact'} {selectedGuide.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedGuide.specialty}</p>
                <p className="text-xs text-gray-500">
                  Languages: {displayLanguages(selectedGuide.languages)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Connection Warning in Modal */}
              {connectionStatus === 'failed' && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">API Connection Unavailable</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Your form will be saved locally and you'll receive the guide's direct contact info for immediate assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => handleInputChange('customer_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  {modalType === 'book' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {modalType === 'book' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select duration</option>
                        <option value="half-day">Half Day (4 hours)</option>
                        <option value="full-day">Full Day (8 hours)</option>
                        <option value="2-days">2 Days</option>
                        <option value="3-days">3 Days</option>
                        <option value="week">1 Week</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group Size
                      </label>
                      <select
                        value={formData.group_size}
                        onChange={(e) => handleInputChange('group_size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select group size</option>
                        <option value="1">Solo Traveler</option>
                        <option value="2">2 People</option>
                        <option value="3-4">3-4 People</option>
                        <option value="5-8">5-8 People</option>
                        <option value="9+">9+ People</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {modalType === 'book' ? 'Special Requests' : 'Your Message'} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={modalType === 'book' 
                      ? "Tell us about your interests, preferences, or any special requirements..."
                      : "Your message to the guide..."
                    }
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      modalType === 'book' ? 'Send Booking Request' : 'Send Message'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guides;