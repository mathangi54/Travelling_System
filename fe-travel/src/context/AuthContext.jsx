import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock authentication service (replace with Firebase, Auth0, or your backend API)
const mockAuthService = {
  login: async (credentials) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('mockAuthService.login called with:', credentials);
        if (credentials.email && credentials.password) {
          const userData = {
            uid: 'mock-user-id',
            username: credentials.email.split('@')[0],
            email: credentials.email,
            token: 'mock-jwt-token',
          };
          console.log('mockAuthService.login resolving with:', userData);
          resolve(userData);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },
  logout: async () => {
    return new Promise((resolve) => setTimeout(resolve, 500));
  },
  refreshToken: async (token) => {
    // Simulate token refresh
    return new Promise((resolve) => {
      setTimeout(() => resolve({ token: 'mock-refreshed-token' }), 500);
    });
  },
};

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize user from localStorage
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userData = localStorage.getItem('currentUser');
        console.log('localStorage.getItem("currentUser"):', userData);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user data:', parsedUser);
          // Validate user data structure
          if (parsedUser && parsedUser.username && parsedUser.token) {
            // Optionally verify token with backend
            const { token } = await mockAuthService.refreshToken(parsedUser.token);
            console.log('Refreshed token:', token);
            setCurrentUser({ ...parsedUser, token });
          } else {
            throw new Error('Invalid user data');
          }
        }
      } catch (err) {
        console.error('Failed to initialize user:', err);
        localStorage.removeItem('currentUser');
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Optional: Set up a token refresh interval (e.g., every 30 minutes)
    const refreshInterval = setInterval(async () => {
      if (currentUser?.token) {
        try {
          const { token } = await mockAuthService.refreshToken(currentUser.token);
          console.log('Token refresh successful:', token);
          setCurrentUser((prev) => ({ ...prev, token }));
          localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, token }));
        } catch (err) {
          console.error('Token refresh failed:', err);
          logout();
        }
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [currentUser?.token]);

  // Login function with validation
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      console.log('AuthProvider.login called with:', credentials);
      const userData = await mockAuthService.login(credentials);
      console.log('Received userData:', userData);
      if (!userData.username || !userData.token) {
        throw new Error('Invalid user data received');
      }
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('currentUser set to:', userData);
      console.log('localStorage set with:', localStorage.getItem('currentUser'));
      navigate('/'); // Navigate to home after login
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('AuthProvider.logout called');
      await mockAuthService.logout();
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      console.log('currentUser cleared, localStorage:', localStorage.getItem('currentUser'));
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to log out');
    }
  };

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      currentUser,
      loading,
      error,
      login,
      logout,
    }),
    [currentUser, loading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}