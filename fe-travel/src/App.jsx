import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import About from './pages/About';
import Packages from './pages/Packages';
import BookingPage from './pages/BookingPage';
import Login from './pages/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import Guides from './pages/Guides';
import CustomTour from './pages/CustomTour';


function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Header />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/guides" element={<Guides />} />
               <Route path="/custom-tour" element={<CustomTour />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Preserve the intended location for redirect after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default App;