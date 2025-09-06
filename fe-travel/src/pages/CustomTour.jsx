import React, { useState } from 'react';
import { sriLankaDestinations } from '../data/destinationsData';

const CustomTour = () => {
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [duration, setDuration] = useState(7);
  const [budget, setBudget] = useState('medium');
  const [showForm, setShowForm] = useState(false);
  const [tourRequest, setTourRequest] = useState({
    name: '',
    email: '',
    phone: '',
    travelDate: '',
    travelers: 1,
    specialRequests: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const toggleDestination = (id) => {
    if (selectedDestinations.includes(id)) {
      setSelectedDestinations(selectedDestinations.filter(item => item !== id));
    } else {
      setSelectedDestinations([...selectedDestinations, id]);
    }
  };

  const selectedPlaces = sriLankaDestinations.filter(dest => 
    selectedDestinations.includes(dest.id)
  );

  const calculateEstimatedCost = () => {
    const baseCost = selectedDestinations.length * 50;
    const durationCost = duration * 30;
    let budgetMultiplier = 1;
    
    if (budget === 'low') budgetMultiplier = 0.7;
    if (budget === 'high') budgetMultiplier = 1.5;
    if (budget === 'luxury') budgetMultiplier = 2.5;
    
    return Math.round((baseCost + durationCost) * budgetMultiplier);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTourRequest({
      ...tourRequest,
      [name]: name === 'travelers' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const customTourData = {
        customer_name: tourRequest.name,
        customer_email: tourRequest.email,
        customer_phone: tourRequest.phone,
        travel_date: tourRequest.travelDate,
        number_of_travelers: tourRequest.travelers,
        duration_days: duration,
        budget_level: budget,
        selected_destinations: selectedDestinations,
        destination_names: selectedPlaces.map(place => place.name),
        estimated_cost: calculateEstimatedCost(),
        special_requests: tourRequest.specialRequests
      };

      console.log('Sending data:', customTourData);

      const response = await fetch('http://localhost:5000/api/custom-tour-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customTourData)
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error(result.message || 'Failed to submit request');
      }

    } catch (error) {
      console.error('Error:', error);
      setSubmissionError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSubmitted(false);
    setSubmissionError('');
    setTourRequest({
      name: '',
      email: '',
      phone: '',
      travelDate: '',
      travelers: 1,
      specialRequests: ''
    });
    setSelectedDestinations([]);
    setDuration(7);
    setBudget('medium');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Create Your Custom Sri Lanka Tour
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Select destinations, choose duration and budget to plan your perfect trip
          </p>
        </div>

        {/* Confirmation Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              {submitted ? (
                <div className="text-center py-4">
                  <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h3>
                  <p className="text-gray-600 mb-4">Your custom tour request has been submitted successfully.</p>
                  <p className="text-gray-600 mb-6">Our travel experts will contact you within 24 hours to discuss your personalized Sri Lankan adventure.</p>
                  <button
                    onClick={resetForm}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium"
                  >
                    Plan Another Tour
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Your Custom Tour Request</h2>
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h3 className="font-medium text-gray-700">Tour Summary</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Destinations:</strong> {selectedPlaces.map(p => p.name).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Duration:</strong> {duration} days
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Budget Level:</strong> {budget.charAt(0).toUpperCase() + budget.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Estimated Cost:</strong> ${calculateEstimatedCost()} per person
                    </p>
                  </div>

                  {submissionError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {submissionError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={tourRequest.name}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={tourRequest.email}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={tourRequest.phone}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Travel Date</label>
                      <input
                        type="date"
                        name="travelDate"
                        value={tourRequest.travelDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Travelers</label>
                      <input
                        type="number"
                        name="travelers"
                        value={tourRequest.travelers}
                        onChange={handleInputChange}
                        min="1"
                        max="20"
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                      <textarea
                        name="specialRequests"
                        value={tourRequest.specialRequests}
                        onChange={handleInputChange}
                        rows={3}
                        disabled={isSubmitting}
                        placeholder="Any specific preferences, dietary requirements, accessibility needs, or special occasions..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting && (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Destination Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore Sri Lanka's Destinations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sriLankaDestinations.map((destination) => (
                <div 
                  key={destination.id}
                  className={`relative bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-300 ${
                    selectedDestinations.includes(destination.id) 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={destination.image}
                      alt={destination.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-xl font-bold text-white">{destination.name}</h3>
                      <p className="text-sm text-gray-200">{destination.region}</p>
                    </div>
                    <button
                      onClick={() => toggleDestination(destination.id)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedDestinations.includes(destination.id)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/90 text-gray-700'
                      }`}
                    >
                      {selectedDestinations.includes(destination.id) ? '✓' : '+'}
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                        {destination.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        Best time: {destination.bestTime}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{destination.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {destination.highlights.map((highlight, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tour Customization Panel */}
          <div className="bg-white p-6 rounded-lg shadow-lg sticky top-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Tour Plan</h2>
            
            {selectedDestinations.length > 0 ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Destinations</h3>
                  <ul className="space-y-2">
                    {selectedPlaces.map(place => (
                      <li key={place.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{place.name}</span>
                        <button 
                          onClick={() => toggleDestination(place.id)}
                          className="text-red-500 hover:text-red-700 text-lg"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tour Duration: {duration} days
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="21"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>3 days</span>
                    <span>21 days</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['low', 'medium', 'high', 'luxury'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setBudget(level)}
                        className={`py-2 px-1 text-xs sm:text-sm rounded ${
                          budget === level
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium text-indigo-800 mb-2">Estimated Cost</h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    ${calculateEstimatedCost()}
                    <span className="text-sm font-normal text-gray-600 ml-1">per person</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Includes accommodation, transport, and guided tours
                  </p>
                </div>

                <button 
                  onClick={() => setShowForm(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition duration-300"
                >
                  Request Custom Tour
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No destinations selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click the + buttons to add destinations to your tour
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sri Lanka Travel Tips */}
        <div className="mt-16 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sri Lanka Travel Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Visa Requirements</h3>
                  <p className="mt-1 text-gray-600">
                    Electronic Travel Authorization (ETA) required for most nationalities.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Best Time to Visit</h3>
                  <p className="mt-1 text-gray-600">
                    West/South coasts: Dec-Mar. East coast: Apr-Sep. Hill country: Jan-Mar.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Currency</h3>
                  <p className="mt-1 text-gray-600">
                    Sri Lankan Rupees (LKR). ATMs widely available. Credit cards accepted in cities.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Health & Safety</h3>
                  <p className="mt-1 text-gray-600">
                    Drink bottled water. Use mosquito repellent. Generally safe for travelers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTour;