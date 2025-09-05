import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Login.jsx: Attempting login with:', { email, password: '***' });
      await authLogin({ email: email.trim(), password });
      console.log('Login.jsx: Login successful, navigating...');
      
      // Get the redirect path with multiple fallback options
      const from = location.state?.from?.pathname || 
                   location.state?.returnTo || 
                   localStorage.getItem('redirectAfterLogin') || 
                   '/';
      
      console.log('Login.jsx: Redirecting to:', from);
      
      // Clear any stored redirect path
      localStorage.removeItem('redirectAfterLogin');
      
      // Handle special cases for booking flow
      if (from === 'booking' || from.includes('/booking')) {
        // If returning to booking, check if we have saved booking data
        const savedBooking = localStorage.getItem('currentBooking');
        if (savedBooking) {
          console.log('Login.jsx: Found saved booking data, redirecting to booking page');
          navigate('/booking', { 
            replace: true,
            state: { 
              package: JSON.parse(savedBooking),
              fromLogin: true 
            }
          });
        } else {
          navigate('/booking', { replace: true });
        }
      } else {
        navigate(from, { replace: true });
      }
      
    } catch (err) {
      console.error('Login.jsx: Login failed:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message || 'Login failed';
      
      if (err.message?.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err.message?.includes('401')) {
        errorMessage = 'Invalid email or password.';
      } else if (err.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Make sure your backend is running on http://localhost:5000';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back to Sri Lanka Tourism
          </p>
          {/* Show context-aware message */}
          {location.state?.returnTo === 'booking' && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              Please login to complete your booking
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-medium">{error}</p>
            {error.includes('connection') && (
              <p className="text-sm mt-1">
                Make sure your backend server is running on http://localhost:5000
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error on input change
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Clear error on input change
                  }}
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
          </div>

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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                state={location.state} // Pass the state to register page too
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Create one here
              </Link>
            </p>
          </div>

         </form>
      </div>
    </div>
  );
};

export default Login;