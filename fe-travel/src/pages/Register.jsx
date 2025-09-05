import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    // Optional profile fields for AI features
    age: '',
    occupation: '',
    monthlyIncome: '',
    cityTier: '2',
    gender: '',
    ownsCar: false,
    hasPassport: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return false;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!form.password) {
      setError('Password is required.');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (form.age && (isNaN(form.age) || form.age < 18 || form.age > 100)) {
      setError('Age must be between 18 and 100.');
      return false;
    }
    if (form.monthlyIncome && isNaN(form.monthlyIncome)) {
      setError('Monthly income must be a valid number.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare registration data
      const registrationData = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        // Only include optional fields if they have values
        ...(form.age && { age: parseInt(form.age) }),
        ...(form.occupation && { occupation: form.occupation.trim() }),
        ...(form.monthlyIncome && { monthly_income: parseFloat(form.monthlyIncome) }),
        ...(form.cityTier && { city_tier: parseInt(form.cityTier) }),
        ...(form.gender && { gender: form.gender }),
        owns_car: form.ownsCar,
        has_passport: form.hasPassport
      };

      console.log('Sending registration data:', registrationData);

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.status === 'success') {
        setSuccess('Registration successful! Redirecting to login...');
        
        // Handle redirect after successful registration
        setTimeout(() => {
          const from = location.state?.from?.pathname || 
                     location.state?.returnTo || 
                     localStorage.getItem('redirectAfterLogin') || 
                     null;
          
          if (from === 'booking' || from?.includes('/booking')) {
            // Redirect to login with booking context
            navigate('/login', { 
              state: { 
                from: { pathname: '/booking' },
                returnTo: 'booking',
                message: 'Registration successful! Please login to complete your booking.'
              } 
            });
          } else if (from) {
            // Redirect to login with the original destination
            navigate('/login', { 
              state: { 
                from: { pathname: from },
                message: 'Registration successful! Please login to continue.'
              } 
            });
          } else {
            // Default redirect to login
            navigate('/login', {
              state: {
                message: 'Registration successful! Please login with your new account.'
              }
            });
          }
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('fetch')) {
        setError('Unable to connect to server. Please ensure the backend is running on http://localhost:5000 and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Sri Lanka Tourism and start your adventure
          </p>
          {/* Show context-aware message */}
          {location.state?.returnTo === 'booking' && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              Create an account to complete your booking
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-medium">{error}</p>
            {error.includes('backend') && (
              <p className="text-sm mt-1">
                Make sure your Flask backend is running on http://localhost:5000
              </p>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p className="font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Optional Fields Toggle */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showOptionalFields ? 'Hide' : 'Show'} Optional Profile Information
              <span className="ml-1 text-xs text-gray-500">
                (for personalized recommendations)
              </span>
            </button>
          </div>

          {/* Optional Fields */}
          {showOptionalFields && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="100"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Software Engineer"
                  value={form.occupation}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Income (USD)
                  </label>
                  <input
                    id="monthlyIncome"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5000"
                    value={form.monthlyIncome}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="cityTier" className="block text-sm font-medium text-gray-700 mb-1">
                    City Tier
                  </label>
                  <select
                    id="cityTier"
                    name="cityTier"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={form.cityTier}
                    onChange={handleChange}
                  >
                    <option value="1">Tier 1 (Major City)</option>
                    <option value="2">Tier 2 (Mid-size City)</option>
                    <option value="3">Tier 3 (Small City/Town)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="ownsCar"
                    name="ownsCar"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={form.ownsCar}
                    onChange={handleChange}
                  />
                  <label htmlFor="ownsCar" className="ml-2 block text-sm text-gray-700">
                    Own a car
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="hasPassport"
                    name="hasPassport"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={form.hasPassport}
                    onChange={handleChange}
                  />
                  <label htmlFor="hasPassport" className="ml-2 block text-sm text-gray-700">
                    Have a passport
                  </label>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                state={location.state} // Pass the state to login page too
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;