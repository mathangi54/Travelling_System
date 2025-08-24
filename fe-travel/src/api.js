import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error.response?.data?.message || error.message);
  }
);

// Tour-related endpoints
export const getTours = () => API.get('/tours');
export const getTourDetails = (id) => API.get(`/tours/${id}`);
export const getTourBookingDetails = (id) => API.get(`/tours/${id}/booking-info`);

// Booking-related endpoints
export const createBooking = (data) => API.post('/booking', data);
export const getBooking = (id) => API.get(`/booking/${id}`);

// Auth-related endpoints
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const logout = () => API.post('/auth/logout');
export const getCurrentUser = () => API.get('/auth/me');

export default {
  getTours,
  getTourDetails,
  getTourBookingDetails,
  createBooking,
  getBooking,
  login,
  register,
  logout,
  getCurrentUser,
};