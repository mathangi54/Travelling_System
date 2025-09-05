import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-date-range';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import { StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

Modal.setAppElement('#root');

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Package & booking details
  const [selectedPackage, setSelectedPackage] = useState('standard');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalAmount, setTotalAmount] = useState(0);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingBookingData, setLoadingBookingData] = useState(true);
  const [bookingError, setBookingError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [availableTours, setAvailableTours] = useState([]);

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: currentUser?.name || currentUser?.username || '',
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

  const API_BASE_URL = 'http://localhost:5000/api';

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

  // Test backend connection function
  const testBackendConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('Testing backend connection...');
      
      const endpoints = [
        `${API_BASE_URL}/health`,
        `${API_BASE_URL}/test-db`,
        `${API_BASE_URL}/tours`,
        'http://localhost:5000/api/health',
        'http://localhost:5000'
      ];

      let connected = false;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${endpoint}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          clearTimeout(timeoutId);
          
          console.log(`Response from ${endpoint}:`, response.status);
          
          if (response.ok || response.status === 404 || response.status === 405) {
            connected = true;
            setBackendStatus('connected');
            setApiError(null);
            console.log('Backend connection successful!');
            break;
          }
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!connected) {
        throw lastError || new Error('All endpoints failed');
      }

      return true;

    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
      
      let errorMessage = 'Unable to connect to backend server. ';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Connection timeout. ';
      } else if (error.message.includes('fetch')) {
        errorMessage += 'Network error. ';
      }
      
      errorMessage += 'Please ensure your Flask backend is running on http://localhost:5000';
      setApiError(errorMessage);
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Load available tours from backend
  const loadAvailableTours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tours`);
      if (response.ok) {
        const data = await response.json();
        const tours = data.data || data || [];
        setAvailableTours(tours);
        console.log('Available tours loaded:', tours.length);
        return tours;
      } else {
        console.warn('Failed to load tours, will seed database');
        return [];
      }
    } catch (error) {
      console.error('Error loading tours:', error);
      return [];
    }
  };

  // Auto-seed database if no tours found
  const ensureToursExist = async () => {
    try {
      const tours = await loadAvailableTours();
      if (tours.length === 0) {
        console.log('No tours found, attempting to seed database...');
        const seedResponse = await fetch(`${API_BASE_URL}/seed-sri-lanka`);
        if (seedResponse.ok) {
          console.log('Database seeded successfully');
          return await loadAvailableTours();
        } else {
          console.warn('Failed to seed database');
          return [];
        }
      }
      return tours;
    } catch (error) {
      console.error('Error ensuring tours exist:', error);
      return [];
    }
  };

  // Validate tour exists
  const validateTour = async (tourId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tours/${tourId}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || data;
      } else {
        console.error(`Tour ${tourId} not found`);
        return null;
      }
    } catch (error) {
      console.error('Tour validation failed:', error);
      return null;
    }
  };

  // Function to get authentication token
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  sessionStorage.getItem('token') || 
                  sessionStorage.getItem('authToken');
    console.log('Getting auth token:', token ? 'Token found' : 'No token found');
    return token;
  };

  // Function to check if user is authenticated
  const checkAuthStatus = () => {
    const token = getAuthToken();
    const userExists = currentUser && Object.keys(currentUser).length > 0;
    const authFlag = isAuthenticated;
    
    console.log('Auth check:', { 
      token: !!token, 
      userExists, 
      authFlag, 
      currentUser: currentUser 
    });
    
    return token && userExists && authFlag;
  };

  // Check backend connection and load tours on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      const isConnected = await testBackendConnection();
      if (isConnected) {
        await ensureToursExist();
      }
    };
    initializeComponent();
  }, []);

  // Check authentication status
  useEffect(() => {
    console.log('BookingPage: Current user:', currentUser);
    console.log('BookingPage: Is authenticated:', isAuthenticated);
    
    if (currentUser) {
      setPersonalInfo(prev => ({
        ...prev,
        fullName: currentUser.name || currentUser.username || prev.fullName,
        email: currentUser.email || prev.email,
      }));
      setShowLoginPrompt(false);
    }
  }, [currentUser, isAuthenticated]);

  // Load booking data
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoadingBookingData(true);
        setBookingError(null);

        const packageFromState = location.state?.package;
        const packageFromStorage = JSON.parse(localStorage.getItem('currentBooking') || 'null');

        if (packageFromState) {
          console.log('Loading package from navigation state:', packageFromState);
          setBookingDetails(packageFromState);
          setTotalAmount(packageFromState.price || packageFromState.original_price || 0);
        } else if (packageFromStorage) {
          console.log('Loading package from localStorage:', packageFromStorage);
          setBookingDetails(packageFromStorage);
          setTotalAmount(packageFromStorage.price || packageFromStorage.original_price || 0);
        } else if (location.state?.packageId) {
          try {
            const isConnected = await testBackendConnection();
            if (!isConnected) {
              throw new Error('Backend not available');
            }

            const tourData = await validateTour(location.state.packageId);
            if (tourData) {
              setBookingDetails(tourData);
              setTotalAmount(tourData.price || 0);
            } else {
              throw new Error('Tour not found');
            }
          } catch (error) {
            console.error('Error fetching tour details:', error);
            setBookingError('Failed to load tour details. Please select a package first.');
            setTimeout(() => navigate('/packages', { replace: true }), 2000);
            return;
          }
        } else {
          // Use first available tour or create default
          await ensureToursExist();
          
          if (availableTours.length > 0) {
            const firstTour = availableTours[0];
            console.log('Using first available tour:', firstTour);
            setBookingDetails(firstTour);
            setTotalAmount(firstTour.price || 150);
          } else {
            // Create default booking details if no tours available
            console.log('No tours available, creating default');
            const defaultPackage = {
              id: 1,
              name: 'Ancient Fortress of Jaffna',
              location: 'Jaffna, Sri Lanka',
              price: 150,
              description: 'Explore the historic fortress and learn about the rich cultural heritage of Jaffna.',
              image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
              rating: 4.5,
              reviews: '150+'
            };
            setBookingDetails(defaultPackage);
            setTotalAmount(defaultPackage.price);
          }
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error loading booking data:', error);
        setBookingError('Failed to load booking details. Please try again.');
        setInitialLoadComplete(true);
      } finally {
        setLoadingBookingData(false);
      }
    };

    loadBookingData();
  }, [location.state, navigate, availableTours]);

  // Calculate total amount
  useEffect(() => {
    if (bookingDetails?.price) {
      setTotalAmount(bookingDetails.price * numberOfPeople);
    } else {
      const packagePrice = packages[selectedPackage].perPerson;
      setTotalAmount(packagePrice * numberOfPeople);
    }
  }, [selectedPackage, numberOfPeople, bookingDetails]);

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep === 2 && !validateStep2()) return;
      
      if (currentStep === 2) {
        testBackendConnection();
      }
      
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
    console.log('Starting booking process...');
    
    if (!validateStep2()) {
      console.log('Step 2 validation failed');
      return;
    }

    // Re-check backend connection before booking
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      setApiError('Cannot connect to backend server. Please ensure your Flask backend is running on http://localhost:5000 and try again.');
      return;
    }

    // Ensure tours exist in database
    const tours = await ensureToursExist();
    if (tours.length === 0) {
      setApiError('No tours available in the database. Please contact support.');
      return;
    }

    // Validate selected tour
    const tourId = bookingDetails?.id || tours[0]?.id || 1;
    const validatedTour = await validateTour(tourId);
    if (!validatedTour) {
      setApiError(`Selected tour (ID: ${tourId}) is not available. Please refresh the page and try again.`);
      return;
    }

    const isReallyAuthenticated = checkAuthStatus();
    console.log('Is really authenticated:', isReallyAuthenticated);

    if (!isReallyAuthenticated) {
      console.log('User not authenticated, showing login prompt');
      setShowLoginPrompt(true);
      
      const bookingData = {
        ...bookingDetails,
        packageType: selectedPackage,
        date: selectedDate.toISOString().split('T')[0],
        persons: numberOfPeople,
        totalPrice: totalAmount,
        customerInfo: personalInfo,
      };
      
      localStorage.setItem('currentBooking', JSON.stringify(bookingData));
      localStorage.setItem('redirectAfterLogin', location.pathname);
      
      navigate('/login', { 
        state: { 
          from: { pathname: location.pathname },
          returnTo: 'booking'
        } 
      });
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const bookingData = {
        tour_id: validatedTour.id,
        travel_date: selectedDate.toISOString().split('T')[0],
        guests: numberOfPeople,
        total_price: totalAmount,
        customer_name: personalInfo.fullName,
        customer_email: personalInfo.email,
        customer_phone: personalInfo.phone,
        special_requests: personalInfo.specialRequests || '',
        package_type: selectedPackage,
        preferred_star_rating: selectedPackage === 'deluxe' ? 5 : selectedPackage === 'premium' ? 4 : 3,
        number_of_children: 0,
      };

      console.log('Sending booking data:', JSON.stringify(bookingData, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(bookingData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json();
      console.log('Booking response:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('authToken');
          
          throw new Error('Your session has expired. Please login again.');
        }
        if (response.status === 404) {
          throw new Error('Booking endpoint not found. Please check if the backend server is running correctly.');
        }
        throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
      }

      const bookingResult = responseData.data || responseData;
      
      setBookingDetails({
        ...validatedTour,
        ...bookingResult,
        customer_name: personalInfo.fullName,
        customer_email: personalInfo.email,
        customer_phone: personalInfo.phone,
        special_requests: personalInfo.specialRequests,
        travel_date: selectedDate.toISOString().split('T')[0],
        guests: numberOfPeople,
        total_price: totalAmount,
      });

      setIsConfirmed(true);
      setShowConfirmationPopup(true);

      localStorage.removeItem('currentBooking');
      localStorage.removeItem('redirectAfterLogin');

      setTimeout(() => {
        setShowConfirmationPopup(false);
        navigate('/', { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error('Booking failed:', error);
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out after 15 seconds. Please check your connection and try again.';
        setBackendStatus('disconnected');
      } else if (error.message.includes('session has expired') || error.message.includes('Authentication token not found')) {
        errorMessage = error.message;
        setShowLoginPrompt(true);
        localStorage.setItem('currentBooking', JSON.stringify({
          ...bookingDetails,
          packageType: selectedPackage,
          date: selectedDate.toISOString().split('T')[0],
          persons: numberOfPeople,
          totalPrice: totalAmount,
          customerInfo: personalInfo,
        }));
      } else if (error.message.includes('NetworkError') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your network connection and ensure the Flask backend is running on http://localhost:5000.';
        setBackendStatus('disconnected');
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}. Please try again or contact support.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
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

  // Show loading state
  if (loadingBookingData && !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
          {backendStatus === 'checking' && (
            <p className="mt-2 text-sm text-gray-500">Checking backend connection...</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state (but still allow form to show)
  if (bookingError && !bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Error</h2>
          <p className="text-gray-600 mb-6">{bookingError}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/packages')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Browse Packages
            </button>
            <button
              onClick={testBackendConnection}
              disabled={isTestingConnection}
              className="w-full px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium disabled:opacity-50"
            >
              {isTestingConnection ? 'Testing...' : 'Test Backend Connection'}
            </button>
          </div>
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

        {/* Backend Status Indicator */}
        {backendStatus === 'disconnected' && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Backend Connection Failed</p>
                <p className="text-sm text-red-700 mt-1">
                  Unable to connect to the Flask backend server. Please ensure it's running on http://localhost:5000
                </p>
                <div className="mt-2">
                  <button
                    onClick={testBackendConnection}
                    disabled={isTestingConnection}
                    className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2 py-1 rounded"
                  >
                    {isTestingConnection ? 'Testing...' : 'Retry Connection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Login Prompt */}
        {showLoginPrompt && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  Authentication Required
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please login or register to complete your booking. Your booking details will be saved.
                </p>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('redirectAfterLogin', location.pathname);
                      navigate('/login', { 
                        state: { 
                          from: { pathname: location.pathname },
                          returnTo: 'booking'
                        } 
                      });
                    }}
                    className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('redirectAfterLogin', location.pathname);
                      navigate('/register', { 
                        state: { 
                          from: { pathname: location.pathname },
                          returnTo: 'booking'
                        } 
                      });
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced API Error Display */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Booking Error</p>
                <p className="text-sm text-red-700 mt-1">{apiError}</p>
                {(apiError.includes('backend is running') || apiError.includes('Unable to connect') || apiError.includes('timed out')) && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      Make sure your Flask backend is running on http://localhost:5000
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={testBackendConnection}
                        disabled={isTestingConnection}
                        className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded"
                      >
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        onClick={() => window.open('http://localhost:5000', '_blank')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Open Backend URL
                      </button>
                    </div>
                  </div>
                )}
                {apiError.includes('session has expired') && (
                  <div className="mt-2">
                    <button
                      onClick={() => navigate('/login', { 
                        state: { 
                          from: { pathname: location.pathname },
                          returnTo: 'booking'
                        } 
                      })}
                      className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                    >
                      Login Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Booking Content */}
        {isConfirmed && bookingDetails ? (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your booking, {bookingDetails.customer_name || personalInfo.fullName}. 
              {bookingDetails.id && ` Your booking ID is #${bookingDetails.id}.`}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
              <div className="space-y-3">
                {bookingDetails.id && <p><span className="font-medium">Booking ID:</span> #{bookingDetails.id}</p>}
                <p><span className="font-medium">Package:</span> {bookingDetails.name || packages[selectedPackage].name}</p>
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
                        src={bookingDetails.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'}
                        alt={bookingDetails.name}
                        className="w-20 h-20 object-cover rounded-md mr-4"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop";
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{bookingDetails.name}</h4>
                        <p className="text-gray-600 text-sm">{bookingDetails.location || 'Sri Lanka'}</p>
                        <div className="flex items-center mt-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="ml-1 text-sm text-gray-600">
                            {bookingDetails.rating || '4.5'} ({bookingDetails.reviews || '100+'} reviews)
                          </span>
                        </div>
                        <p className="mt-2 font-bold text-blue-700">
                          ${bookingDetails.price || 0}/person
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
                      {availableTours.slice(0, 4).map((tour) => (
                        <div key={tour.id} className="relative rounded-lg overflow-hidden h-24 cursor-pointer"
                             onClick={() => setBookingDetails(tour)}>
                          <img
                            src={tour.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'}
                            alt={tour.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-2">
                            <span className="text-white text-sm font-medium">{tour.name}</span>
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
                      className={`w-full ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
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
                              src={bookingDetails.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'}
                              alt={bookingDetails.name}
                              className="w-16 h-16 object-cover rounded-md mr-4"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop";
                              }}
                            />
                            <div>
                              <h6 className="font-medium">{bookingDetails.name}</h6>
                              <p className="text-sm text-gray-600">{bookingDetails.location || 'Sri Lanka'}</p>
                              <p className="text-sm text-blue-600 font-medium">${bookingDetails.price}/person</p>
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package Type:</span>
                          <span className="font-medium">{packages[selectedPackage].name}</span>
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
                          <span className="text-gray-600">
                            {bookingDetails ? `${bookingDetails.name}` : packages[selectedPackage].name} 
                            ({numberOfPeople} x ${bookingDetails?.price || packages[selectedPackage].perPerson})
                          </span>
                          <span>${(bookingDetails?.price || packages[selectedPackage].perPerson) * numberOfPeople}</span>
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
                  className={`px-6 py-2 ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-md transition-colors disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
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