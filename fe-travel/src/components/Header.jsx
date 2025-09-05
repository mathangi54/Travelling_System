import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Debugging: Log currentUser to check its value
  console.log('Header.jsx: Current User:', currentUser);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('Header.jsx: Initiating logout');
      await logout();
      console.log('Header.jsx: Logout successful');
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Header.jsx: Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200">
              Travel Explorer
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">About</Link>
            <Link to="/packages" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Packages</Link>
            <Link to="/guides" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Guides</Link>
            <Link to="/custom-tour" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">Custom Tour</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-gray-700 font-medium">
                  {currentUser.username || 'User'}
                </span>
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isLoggingOut}
                  className={`group relative flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out ${
                    isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  aria-label="Log out"
                >
                  {isLoggingOut ? (
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  )}
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Log in"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  aria-label="Register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-gray-600">Are you sure you want to log out?</p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out ${
                  isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;