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

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        console.log('AuthContext: Initializing auth...');
        console.log('AuthContext: Token found:', !!token);
        console.log('AuthContext: User data found:', !!userData);

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('AuthContext: User restored from localStorage:', user);
          } catch (error) {
            console.error('AuthContext: Error parsing stored user data:', error);
            // Clear corrupted data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
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
        const errorData = await response.json();
        console.error('AuthContext: Login failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthContext: Login success:', data);

      if (data.status === 'success' && data.data) {
        const { token, user } = data.data;
        
        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // Backup key
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        console.log('AuthContext: User logged in successfully:', user);
        return { success: true, user, token };
      } else {
        throw new Error(data.message || 'Login failed - invalid response format');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      // Clear any existing auth data on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      throw error;
    }
  };

  // Register function
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
        const errorData = await response.json();
        console.error('AuthContext: Registration failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthContext: Registration success:', data);

      if (data.status === 'success') {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    console.log('AuthContext: Logging out user');
    
    try {
      // Optional: Call backend logout endpoint
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('AuthContext: Backend logout failed (continuing with local logout):', error);
        }
      }
    } catch (error) {
      console.warn('AuthContext: Error during logout:', error);
    } finally {
      // Always clear local auth data
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentBooking');
      localStorage.removeItem('redirectAfterLogin');
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      console.log('AuthContext: User logged out successfully');
    }
  };

  // Check if token is valid
  const validateToken = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (!token) {
      console.log('AuthContext: No token found for validation');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          console.log('AuthContext: Token validation successful');
          return true;
        }
      }
      
      console.log('AuthContext: Token validation failed');
      // If token is invalid, clear auth data
      logout();
      return false;
    } catch (error) {
      console.error('AuthContext: Token validation error:', error);
      // On network error, assume token might still be valid
      return true;
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
    
    console.log('AuthContext: Auth status check:', { 
      token: !!token, 
      userExists, 
      authFlag,
      currentUser: currentUser?.email || 'None'
    });
    
    return token && userExists && authFlag;
  };

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;