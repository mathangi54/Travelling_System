import React, { useState, useEffect, useContext } from 'react';
import { login, register } from '../api';
import { AppContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const AuthModal = ({ onClose, initialMode = 'login', onSuccess }) => {
  const { handleAuth } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState(initialMode);

  // Reset form when mode changes
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      username: '',
    });
    setError(null);
    setPasswordStrength(null);
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    const strengthChecks = {
      length: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const strength = Object.values(strengthChecks).filter(Boolean).length;
    setPasswordStrength({
      value: strength,
      checks: strengthChecks,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'login') {
        // Validate login form
        if (!formData.email || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        response = await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Validate register form
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        if (passwordStrength?.value < 3) {
          throw new Error('Password is too weak');
        }
        response = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      }

      // Handle successful authentication
      handleAuth(response);

      // Call success callback if provided
      if (onSuccess) onSuccess(response);

      // Check for stored booking data
      const storedBooking = localStorage.getItem('currentBooking');
      const from = location.state?.from || '/';
      if (storedBooking && from === '/booking') {
        const bookingData = JSON.parse(storedBooking);
        navigate('/booking', {
          state: {
            package: bookingData,
            timestamp: Date.now(),
          },
        });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${mode}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    if (passwordStrength.value <= 2) return 'bg-red-500';
    if (passwordStrength.value <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderPasswordRequirements = () => {
    if (mode !== 'register' || !passwordStrength) return null;

    return (
      <div className="mt-2 text-xs text-gray-600">
        <p className="font-medium mb-1">Password Requirements:</p>
        <ul className="space-y-1">
          <li className={`flex items-center ${passwordStrength.checks.length ? 'text-green-500' : 'text-red-500'}`}>
            {passwordStrength.checks.length ? '✓' : '✗'} At least 8 characters
          </li>
          <li className={`flex items-center ${passwordStrength.checks.hasUpperCase ? 'text-green-500' : 'text-red-500'}`}>
            {passwordStrength.checks.hasUpperCase ? '✓' : '✗'} At least one uppercase letter
          </li>
          <li className={`flex items-center ${passwordStrength.checks.hasLowerCase ? 'text-green-500' : 'text-red-500'}`}>
            {passwordStrength.checks.hasLowerCase ? '✓' : '✗'} At least one lowercase letter
          </li>
          <li className={`flex items-center ${passwordStrength.checks.hasNumbers ? 'text-green-500' : 'text-red-500'}`}>
            {passwordStrength.checks.hasNumbers ? '✓' : '✗'} At least one number
          </li>
          <li className={`flex items-center ${passwordStrength.checks.hasSpecialChars ? 'text-green-500' : 'text-red-500'}`}>
            {passwordStrength.checks.hasSpecialChars ? '✓' : '✗'} At least one special character
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login' ? 'Login' : 'Register'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isLoading}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                  minLength="3"
                  disabled={isLoading}
                  placeholder="Enter your username"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
                disabled={isLoading}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
                minLength={mode === 'register' ? "8" : "6"}
                disabled={isLoading}
                placeholder={mode === 'register' ? "Create a password" : "Enter your password"}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {mode === 'register' && (
              <>
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full">
                    <div
                      className={`h-1 rounded-full ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength?.value / 5) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
                {renderPasswordRequirements()}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg transition flex items-center justify-center ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 hover:underline focus:outline-none"
                disabled={isLoading}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:underline focus:outline-none"
                disabled={isLoading}
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;