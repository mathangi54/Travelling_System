import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import About from './pages/About';
import Packages from './pages/Packages';
import BookingPage from './pages/BookingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import Footer from './components/Footer';
import Guides from './pages/Guides';
import CustomTour from './pages/CustomTour';
import Chatbot from './components/Chatbot';
import AITrainingDashboard from './components/AITrainingDashboard';

// Simple loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Simple 404 component
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full text-center">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Go to Homepage
      </button>
    </div>
  </div>
);

// App initialization hook
const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check API connection
        const response = await fetch('http://localhost:5000/api/test-db');
        if (!response.ok) {
          throw new Error('Backend server is not running');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(error.message);
        setIsInitialized(true); // Still allow app to load
      }
    };

    initializeApp();
  }, []);

  return { isInitialized, initError };
};

// Enhanced Protected Route with role-based access
function ProtectedRoute({ children, requireAdmin = false, requireAuth = true }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// Public Route (redirect to home if already logged in for login/register pages)
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (currentUser && (location.pathname === '/login' || location.pathname === '/register')) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}

// Main App Content
function AppContent() {
  const { isInitialized, initError } = useAppInitialization();

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global error banner */}
      {initError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                Warning: {initError}. Some features may not work properly.
              </p>
            </div>
          </div>
        </div>
      )}

      <Header />
      
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/custom-tour" element={<CustomTour />} />
          <Route path="/booking" element={<BookingPage />} />
          
          {/* Public routes that redirect if already logged in */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/ai-training" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AITrainingDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route - 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Components */}
      <Chatbot />
      <Footer />
    </div>
  );
}

// Root App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;