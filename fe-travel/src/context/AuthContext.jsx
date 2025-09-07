import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // API base URL - Fixed to handle undefined process.env
  const API_BASE_URL = import.meta.env.VITE_API_URL || 
                       (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
                       'http://localhost:5000/api';

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        console.log('AuthContext: Token found:', !!token);
        console.log('AuthContext: User data found:', !!userData);

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            console.log('AuthContext: Parsed user data:', user);
            
            // Since your backend doesn't have a validate endpoint, 
            // we'll trust the stored data if it exists
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('AuthContext: User restored from localStorage:', user);
          } catch (error) {
            console.error('AuthContext: Error parsing stored user data:', error);
            clearAuthData();
          }
        } else {
          console.log('AuthContext: No stored auth data found');
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
      } finally {
        setLoading(false);
        console.log('AuthContext: Initialization complete');
      }
    };

    initializeAuth();
  }, []);

  // Helper function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentBooking');
    localStorage.removeItem('redirectAfterLogin');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Login function - matches your Flask backend
  const login = async ({ email, password }) => {
    console.log('AuthContext: Login attempt for:', email);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('AuthContext: Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`
        }));
        console.error('AuthContext: Login failed:', errorData);
        throw new Error(errorData.message || `Login failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthContext: Login success:', data);

      if (data.status === 'success' && data.data) {
        const { token, user } = data.data;
        
        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // Backup key
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state immediately
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        console.log('AuthContext: User logged in successfully:', user);
        console.log('AuthContext: Auth state updated - isAuthenticated:', true);
        
        return { success: true, user, token };
      } else {
        throw new Error(data.message || 'Login failed - invalid response format');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      // Clear any existing auth data on login failure
      clearAuthData();
      
      throw error;
    }
  };

  // Register function - matches your Flask backend
  const register = async (userData) => {
    console.log('AuthContext: Registration attempt for:', userData.email);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('AuthContext: Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`
        }));
        console.error('AuthContext: Registration failed:', errorData);
        throw new Error(errorData.message || `Registration failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthContext: Registration success:', data);

      if (data.status === 'success') {
        // Automatically log in the user after successful registration
        if (data.data && data.data.token && data.data.user) {
          const { token, user } = data.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          console.log('AuthContext: User auto-logged in after registration');
        }
        
        return { success: true, message: data.message, autoLogin: !!data.data };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  };

  // Logout function - simplified since backend logout isn't implemented
  const logout = async () => {
    console.log('AuthContext: Logging out user');
    
    try {
      // Optional: Call backend logout endpoint if it exists
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        try {
          // Your backend doesn't have a logout endpoint, so we'll skip this
          // await fetch(`${API_BASE_URL}/auth/logout`, {
          //   method: 'POST',
          //   headers: {
          //     'Authorization': `Bearer ${token}`,
          //     'Content-Type': 'application/json',
          //   },
          // });
        } catch (error) {
          console.warn('AuthContext: Backend logout failed (continuing with local logout):', error);
        }
      }
    } catch (error) {
      console.warn('AuthContext: Error during logout:', error);
    } finally {
      // Always clear local auth data
      clearAuthData();
      console.log('AuthContext: User logged out successfully');
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Backend connection successful:', data);
        return true;
      }
      console.warn('AuthContext: Backend health check failed');
      return false;
    } catch (error) {
      console.error('AuthContext: Backend connection failed:', error);
      return false;
    }
  };

  // Simplified token validation - just checks if token exists
  const validateToken = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (!token) {
      console.log('AuthContext: No token found for validation');
      return false;
    }

    // Since your backend doesn't have a validate endpoint,
    // we'll just check if the token exists and user data is valid
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user && (user.email || user.username)) {
          console.log('AuthContext: Token validation successful (local check)');
          return true;
        }
      }
      
      console.log('AuthContext: Token validation failed (no valid user data)');
      logout();
      return false;
    } catch (error) {
      console.error('AuthContext: Token validation error:', error);
      logout();
      return false;
    }
  };

  // Get current auth token
  const getToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Update user data
  const updateUser = (updatedUserData) => {
    console.log('AuthContext: Updating user data:', updatedUserData);
    
    const updatedUser = { ...currentUser, ...updatedUserData };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Check authentication status
  const checkAuthStatus = () => {
    const token = getToken();
    const userExists = currentUser && Object.keys(currentUser).length > 0;
    const authFlag = isAuthenticated;
    
    const isFullyAuthenticated = !!(token && userExists && authFlag);
    
    console.log('AuthContext: Auth status check:', { 
      token: !!token, 
      userExists, 
      authFlag,
      isFullyAuthenticated,
      currentUser: currentUser?.email || currentUser?.username || 'None'
    });
    
    return isFullyAuthenticated;
  };

  // Helper to check if user is logged in
  const isLoggedIn = () => {
    return isAuthenticated && currentUser !== null;
  };

  // Debug auth state
  const debugAuthState = () => {
    const debugInfo = {
      currentUser: currentUser,
      isAuthenticated: isAuthenticated,
      loading: loading,
      token: !!getToken(),
      tokenValue: getToken()?.substring(0, 20) + '...',
      apiBaseUrl: API_BASE_URL,
      localStorage: {
        token: !!localStorage.getItem('token'),
        authToken: !!localStorage.getItem('authToken'),
        user: !!localStorage.getItem('user')
      }
    };
    
    console.log('AuthContext: Debug Auth State:', debugInfo);
    return debugInfo;
  };

  // Effect to log auth state changes
  useEffect(() => {
    console.log('AuthContext: Auth state changed:', {
      isAuthenticated,
      hasUser: !!currentUser,
      userEmail: currentUser?.email || currentUser?.username,
      loading
    });
  }, [isAuthenticated, currentUser, loading]);

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    validateToken,
    getToken,
    updateUser,
    checkAuthStatus,
    isLoggedIn,
    debugAuthState,
    clearAuthData,
    testBackendConnection, // Added for debugging
    API_BASE_URL, // Exposed for other components
  };

  console.log('AuthContext: Rendering with state:', {
    isAuthenticated,
    hasCurrentUser: !!currentUser,
    loading,
    userInfo: currentUser ? `${currentUser.email || currentUser.username}` : 'None'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;