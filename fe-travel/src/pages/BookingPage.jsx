import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-date-range';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { createBooking, getTourBookingDetails } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import { StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

Modal.setAppElement('#root');

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Package & booking details
  const [selectedPackage, setSelectedPackage] = useState('standard');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalAmount, setTotalAmount] = useState(0);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingBookingData, setLoadingBookingData] = useState(true);
  const [bookingError, setBookingError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    specialRequests: '',
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

  // Get package data from navigation state or localStorage
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoadingBookingData(true);
        setBookingError(null);

        const packageFromState = location.state?.package;
        const packageFromStorage = JSON.parse(localStorage.getItem('currentBooking'));

        if (packageFromState) {
          setBookingDetails(packageFromState);
          setTotalAmount(packageFromState.price);
        } else if (packageFromStorage) {
          setBookingDetails(packageFromStorage);
          setTotalAmount(packageFromStorage.price);
        } else if (location.state?.packageId) {
          const data = await getTourBookingDetails(location.state.packageId);
          setBookingDetails(data);
          setTotalAmount(data.price);
        } else {
          setBookingError('Please select a package first');
          navigate('/packages', { replace: true });
          return;
        }
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error loading booking data:', error);
        setBookingError('Failed to load booking details. Please try again.');
        navigate('/packages', { replace: true });
      } finally {
        setLoadingBookingData(false);
      }
    };

    loadBookingData();
  }, [location.state, navigate]);

  const packages = {
    standard: {
      name: 'Standard Package',
      perPerson: 100,
      description: 'Basic tour package with essential amenities',
      features: ['Guided tour', 'Basic accommodation', 'Local transportation'],
      dbId: 1,
    },
    premium: {
      name: 'Premium Package',
      perPerson: 200,
      description: 'Enhanced experience with additional services',
      features: ['Private guide', '4-star accommodation', 'All meals included', 'Airport transfers'],
      dbId: 2,
    },
    deluxe: {
      name: 'Deluxe Package',
      perPerson: 350,
      description: 'Luxury experience with premium services',
      features: ['VIP treatment', '5-star accommodation', 'Gourmet meals', 'Private transfers', 'Spa access'],
      dbId: 3,
    },
  };

  const popularDestinations = [
    { id: 1, name: 'Colombo, Sri Lanka', image: 'https://placehold.co/400x300?text=Colombo' },
    { id: 2, name: 'Kandy, Sri Lanka', image: 'https://placehold.co/400x300?text=Kandy' },
    { id: 3, name: 'Galle, Sri Lanka', image: 'https://placehold.co/400x300?text=Galle' },
    { id: 4, name: 'Sigiriya, Sri Lanka', image: 'https://placehold.co/400x300?text=Sigiriya' },
  ];

  useEffect(() => {
    calculateTotal();
  }, [selectedPackage, numberOfPeople]);

  const calculateTotal = () => {
    const packagePrice = packages[selectedPackage].perPerson;
    setTotalAmount(packagePrice * numberOfPeople);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePeopleChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value > 0 && value <= 20) {
        setNumberOfPeople(value);
        setErrors((prev) => ({ ...prev, numberOfPeople: null }));
      } else {
        setErrors((prev) => ({
          ...prev,
          numberOfPeople: 'Please enter a valid number between 1 and 20',
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
    setApiError(null);
  };

  const handlePhoneChange = (phone) => {
    setPersonalInfo((prev) => ({
      ...prev,
      phone: phone || '',
    }));

    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: null,
      }));
    }
    setApiError(null);
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (numberOfPeople < 1 || numberOfPeople > 20) {
      newErrors.numberOfPeople = 'Please enter a valid number between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!personalInfo.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!personalInfo.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]+$/.test(personalInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep === 2 && !validateStep2()) return;
      setCurrentStep((prev) => prev + 1);
      setApiError(null);
      setShowLoginPrompt(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setApiError(null);
    }
  };

  const handleBooking = async () => {
    if (!validateStep2()) return;

    if (!currentUser) {
      setShowLoginPrompt(true);
      // Store the current booking data to persist after login
      localStorage.setItem('currentBooking', JSON.stringify({
        ...bookingDetails,
        packageType: selectedPackage,
        date: selectedDate.toISOString().split('T')[0],
        persons: numberOfPeople,
        totalPrice: totalAmount,
        customerInfo: personalInfo,
      }));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const bookingData = {
        packageId: packages[selectedPackage].dbId,
        date: selectedDate.toISOString().split('T')[0],
        persons: numberOfPeople,
        totalPrice: totalAmount,
        customerInfo: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          specialRequests: personalInfo.specialRequests,
        },
        packageType: selectedPackage,
        ...(bookingDetails && { packageDetails: bookingDetails }),
      };

      const response = await createBooking(bookingData);

      const bookingDetailsResponse = response.data || response;

      if (!bookingDetailsResponse) {
        throw new Error('Invalid booking response from server');
      }

      setBookingDetails(bookingDetailsResponse);
      setIsConfirmed(true);
      setShowConfirmationPopup(true);

      localStorage.removeItem('currentBooking');

      setTimeout(() => {
        setShowConfirmationPopup(false);
        navigate('/', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Booking failed:', error);
      setApiError(error.response?.data?.message || error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[...Array(totalSteps)].map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > i + 1 ? 'bg-green-500' :
              currentStep === i + 1 ? 'bg-blue-600' : 'bg-gray-300'
            } text-white font-medium`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`h-1 w-16 ${currentStep > i + 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (!initialLoadComplete || loadingBookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Error</h2>
          <p className="text-gray-600 mb-6">{bookingError}</p>
          <button
            onClick={() => navigate('/packages')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            Browse Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {bookingDetails ? `Book ${bookingDetails.name}` : 'Book Your Sri Lanka Tour'}
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            {currentStep === 1 && 'Select your package and travel details'}
            {currentStep === 2 && 'Enter your personal information'}
            {currentStep === 3 && 'Review and confirm your booking'}
          </p>
        </div>

        {renderStepIndicator()}

        {showLoginPrompt && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please login or register to complete your booking.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Click here to login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {isConfirmed && bookingDetails ? (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your booking, {bookingDetails.customer_name || personalInfo.fullName}. We've sent the details to {bookingDetails.customer_email || personalInfo.email}.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Booking ID:</span> {bookingDetails.id}</p>
                <p><span className="font-medium">Package:</span> {bookingDetails.tour_name || packages[selectedPackage].name}</p>
                <p><span className="font-medium">Date:</span> {formatDate(bookingDetails.travel_date || selectedDate)}</p>
                <p><span className="font-medium">Travelers:</span> {bookingDetails.guests || numberOfPeople}</p>
                <p><span className="font-medium">Total Amount:</span> ${bookingDetails.total_price || totalAmount}</p>
                <p><span className="font-medium">Contact:</span> {bookingDetails.customer_phone || personalInfo.phone}</p>
                {bookingDetails.special_requests && (
                  <p><span className="font-medium">Special Requests:</span> {bookingDetails.special_requests}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/', { replace: true })}
              className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Step 1: Package Selection */}
            {currentStep === 1 && (
              <div className="px-4 py-5 sm:p-6">
                {bookingDetails && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-2">Selected Package</h3>
                    <div className="flex items-start">
                      <img
                        src={bookingDetails.image_url}
                        alt={bookingDetails.name}
                        className="w-20 h-20 object-cover rounded-md mr-4"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/100?text=No+Image";
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{bookingDetails.name}</h4>
                        <p className="text-gray-600 text-sm">{bookingDetails.location}</p>
                        <div className="flex items-center mt-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="ml-1 text-sm text-gray-600">
                            {bookingDetails.rating} ({bookingDetails.reviews} reviews)
                          </span>
                        </div>
                        <p className="mt-2 font-bold text-blue-700">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(bookingDetails.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select a Package</h4>
                    <div className="space-y-4">
                      {Object.keys(packages).map((pkg) => (
                        <div
                          key={pkg}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPackage === pkg ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{packages[pkg].name}</h5>
                              <p className="text-gray-600 text-sm mt-1">{packages[pkg].description}</p>
                              <ul className="mt-2 text-sm text-gray-600">
                                {packages[pkg].features.map((feature, i) => (
                                  <li key={i} className="flex items-center mt-1">
                                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <span className="font-bold">${packages[pkg].perPerson}/person</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Number of Travelers</h4>
                      <div className="flex items-center">
                        <button
                          onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                          className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                          disabled={numberOfPeople <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={numberOfPeople}
                          onChange={handlePeopleChange}
                          className="w-16 px-3 py-1 border-t border-b border-gray-300 text-center"
                        />
                        <button
                          onClick={() => setNumberOfPeople(Math.min(20, numberOfPeople + 1))}
                          className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                          disabled={numberOfPeople >= 20}
                        >
                          +
                        </button>
                      </div>
                      {errors.numberOfPeople && (
                        <p className="mt-1 text-sm text-red-500">{errors.numberOfPeople}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select Travel Date</h4>
                    <div className="mb-6">
                      <Calendar
                        date={selectedDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        className="border rounded-lg"
                      />
                    </div>

                    <h4 className="text-lg font-medium text-gray-900 mb-4">Popular Destinations</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {popularDestinations.map((destination) => (
                        <div key={destination.id} className="relative rounded-lg overflow-hidden h-24">
                          <img
                            src={destination.image}
                            alt={destination.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/400x300?text=Destination';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-2">
                            <span className="text-white text-sm font-medium">{destination.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h4>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={personalInfo.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      international
                      defaultCountry="LK"
                      value={personalInfo.phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={personalInfo.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dietary restrictions, accessibility needs, etc."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review and Confirm */}
            {currentStep === 3 && (
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-6">Review Your Booking</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Package Details</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {bookingDetails ? (
                        <>
                          <div className="flex items-start mb-4">
                            <img
                              src={bookingDetails.image_url}
                              alt={bookingDetails.name}
                              className="w-16 h-16 object-cover rounded-md mr-4"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100?text=No+Image";
                              }}
                            />
                            <div>
                              <h6 className="font-medium">{bookingDetails.name}</h6>
                              <p className="text-sm text-gray-600">{bookingDetails.location}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{bookingDetails.description}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium">{packages[selectedPackage].name}</span>
                            <span>${packages[selectedPackage].perPerson}/person</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{packages[selectedPackage].description}</p>
                        </>
                      )}

                      <div className="mt-4">
                        <h6 className="text-sm font-medium text-gray-900 mb-2">Included Features:</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {packages[selectedPackage].features.map((feature, i) => (
                            <li key={i} className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 mb-3">Travel Information</h5>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Travel Date:</span>
                          <span className="font-medium">{formatDate(selectedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Number of Travelers:</span>
                          <span className="font-medium">{numberOfPeople}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Personal Information</h5>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-gray-600 text-sm">Full Name</p>
                        <p className="font-medium">{personalInfo.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Email</p>
                        <p className="font-medium">{personalInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Phone</p>
                        <p className="font-medium">{personalInfo.phone}</p>
                      </div>
                      {personalInfo.specialRequests && (
                        <div>
                          <p className="text-gray-600 text-sm">Special Requests</p>
                          <p className="font-medium">{personalInfo.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Payment Summary</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package Price ({numberOfPeople} x ${packages[selectedPackage].perPerson})</span>
                          <span>${packages[selectedPackage].perPerson * numberOfPeople}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                          <span className="font-medium">Total Amount</span>
                          <span className="font-bold text-blue-600">${totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="px-4 py-4 bg-gray-50 sm:px-6 flex justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={isLoading}
                  className={`px-6 py-2 ${isLoading ? 'bg-gray-400' : 'bg-green-600'} text-white rounded-md hover:${isLoading ? 'bg-gray-400' : 'bg-green-700'} disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Confirm Booking'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Popup */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto text-center animate-fade-in">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600">Redirecting to home page...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;