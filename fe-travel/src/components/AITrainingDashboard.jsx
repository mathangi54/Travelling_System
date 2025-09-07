import React, { useState, useEffect } from 'react';

// Mock useAuth hook - replace with your actual auth context
const useAuth = () => ({
  currentUser: { username: 'john_doe', id: 1, email: 'john@example.com' },
  logout: () => console.log('Logout clicked')
});

const AITrainingDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [guideRequests, setGuideRequests] = useState([]);
  const [customTourRequests, setCustomTourRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('guide-requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('token') || 
           sessionStorage.getItem('authToken');
  };

  // Make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      logout();
      throw new Error('Authentication expired. Please login again.');
    }
    
    return response;
  };

  // Fetch guide requests
  const fetchGuideRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/guide-requests`);
      
      if (response.ok) {
        const data = await response.json();
        setGuideRequests(data.data || []);
      } else {
        throw new Error('Failed to fetch guide requests');
      }
    } catch (error) {
      console.error('Error fetching guide requests:', error);
      setError(error.message);
    }
  };

  // Fetch custom tour requests
  const fetchCustomTourRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/custom-tour-requests`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomTourRequests(data.data || []);
      } else {
        throw new Error('Failed to fetch custom tour requests');
      }
    } catch (error) {
      console.error('Error fetching custom tour requests:', error);
      setError(error.message);
    }
  };

  // Load all data
  const loadUserHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchGuideRequests(),
        fetchCustomTourRequests()
      ]);
    } catch (error) {
      setError('Failed to load user history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('AITrainingDashboard component mounted');
    loadUserHistory();
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', symbol: '⏳' },
      contacted: { color: 'bg-blue-100 text-blue-800', symbol: '💬' },
      confirmed: { color: 'bg-green-100 text-green-800', symbol: '✅' },
      cancelled: { color: 'bg-red-100 text-red-800', symbol: '❌' },
      reviewed: { color: 'bg-purple-100 text-purple-800', symbol: '👁️' },
      quoted: { color: 'bg-indigo-100 text-indigo-800', symbol: '💰' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.symbol}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Parse JSON safely
  const parseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  // Guide Request Card
  const GuideRequestCard = ({ request }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{request.guide_name}</h3>
          <p className="text-sm text-gray-600">{request.request_type} Request</p>
        </div>
        <StatusBadge status={request.status} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">👤</span>
          {request.customer_name}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">📧</span>
          {request.customer_email}
        </div>
        {request.customer_phone && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📞</span>
            {request.customer_phone}
          </div>
        )}
        {request.preferred_date && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📅</span>
            Preferred Date: {formatDate(request.preferred_date)}
          </div>
        )}
        {request.group_size && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">👥</span>
            Group Size: {request.group_size}
          </div>
        )}
      </div>
      
      {request.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">{request.message}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Submitted: {formatDate(request.created_at)}</span>
        <button
          onClick={() => setSelectedRequest({ ...request, type: 'guide' })}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );

  // Custom Tour Request Card
  const CustomTourRequestCard = ({ request }) => {
    const destinations = parseJSON(request.selected_destinations);
    const destinationNames = parseJSON(request.destination_names);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Custom Tour Request</h3>
            <p className="text-sm text-gray-600">{request.duration_days} days • {request.budget_level} budget</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">👤</span>
            {request.customer_name}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📧</span>
            {request.customer_email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">👥</span>
            {request.number_of_travelers} travelers
          </div>
          {request.travel_date && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">📅</span>
              Travel Date: {formatDate(request.travel_date)}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">💰</span>
            Estimated Cost: ${request.estimated_cost}
          </div>
        </div>
        
        {destinationNames.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Destinations:</h4>
            <div className="flex flex-wrap gap-2">
              {destinationNames.map((destination, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <span className="mr-1">📍</span>
                  {destination}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {request.special_requests && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Special Requests:</h4>
            <p className="text-sm text-gray-700">{request.special_requests}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Submitted: {formatDate(request.created_at)}</span>
          <button
            onClick={() => setSelectedRequest({ ...request, type: 'custom' })}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  // Detail Modal
  const DetailModal = ({ request, onClose }) => {
    if (!request) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {request.type === 'guide' ? 'Guide Request Details' : 'Custom Tour Request Details'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {request.customer_name}</p>
                  <p><span className="font-medium">Email:</span> {request.customer_email}</p>
                  {request.customer_phone && (
                    <p><span className="font-medium">Phone:</span> {request.customer_phone}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Request Status</h3>
                <StatusBadge status={request.status} />
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Submitted:</span> {formatDate(request.created_at)}
                  </p>
                  {request.updated_at && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Updated:</span> {formatDate(request.updated_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {request.type === 'guide' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Guide Information</h3>
                  <p><span className="font-medium">Guide:</span> {request.guide_name}</p>
                  <p><span className="font-medium">Email:</span> {request.guide_email}</p>
                  <p><span className="font-medium">Phone:</span> {request.guide_phone}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Tour Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {request.preferred_date && (
                      <p><span className="font-medium">Preferred Date:</span> {formatDate(request.preferred_date)}</p>
                    )}
                    {request.duration && (
                      <p><span className="font-medium">Duration:</span> {request.duration}</p>
                    )}
                    {request.group_size && (
                      <p><span className="font-medium">Group Size:</span> {request.group_size}</p>
                    )}
                    {request.tour_type && (
                      <p><span className="font-medium">Tour Type:</span> {request.tour_type}</p>
                    )}
                  </div>
                </div>
                
                {request.message && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Message</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700">{request.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Tour Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><span className="font-medium">Duration:</span> {request.duration_days} days</p>
                    <p><span className="font-medium">Budget Level:</span> {request.budget_level}</p>
                    <p><span className="font-medium">Travelers:</span> {request.number_of_travelers}</p>
                    <p><span className="font-medium">Estimated Cost:</span> ${request.estimated_cost}</p>
                    {request.travel_date && (
                      <p><span className="font-medium">Travel Date:</span> {formatDate(request.travel_date)}</p>
                    )}
                  </div>
                </div>
                
                {parseJSON(request.destination_names).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Selected Destinations</h3>
                    <div className="flex flex-wrap gap-2">
                      {parseJSON(request.destination_names).map((destination, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          <span className="mr-1">📍</span>
                          {destination}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {request.special_requests && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Special Requests</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700">{request.special_requests}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your travel history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Sri Lanka Travel History</h1>
              <p className="text-gray-600">Track your guide requests and custom tour bookings</p>
              {currentUser && (
                <p className="text-sm text-blue-600">
                  Welcome back, {currentUser.username}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={loadUserHistory}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Refresh
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
            <button
              onClick={loadUserHistory}
              className="ml-4 text-red-800 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Debug info for troubleshooting */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
          <p className="text-sm text-blue-700">Component loaded: ✓</p>
          <p className="text-sm text-blue-700">API URL: {API_BASE_URL}</p>
          <p className="text-sm text-blue-700">Guide Requests: {guideRequests.length}</p>
          <p className="text-sm text-blue-700">Custom Tour Requests: {customTourRequests.length}</p>
          <p className="text-sm text-blue-700">Current User: {currentUser?.username || 'Not logged in'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Guide Requests</h3>
            <p className="text-3xl font-bold text-blue-600">{guideRequests.length}</p>
            <p className="text-sm text-gray-600">Total submissions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Custom Tours</h3>
            <p className="text-3xl font-bold text-green-600">{customTourRequests.length}</p>
            <p className="text-sm text-gray-600">Personalized requests</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-purple-600">{guideRequests.length + customTourRequests.length}</p>
            <p className="text-sm text-gray-600">All time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('guide-requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'guide-requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Guide Requests ({guideRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('custom-tours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'custom-tours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Custom Tours ({customTourRequests.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'guide-requests' && (
            <div>
              {guideRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🗣️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No guide requests yet</h3>
                  <p className="text-gray-500">Start by requesting a local guide for your Sri Lanka adventure!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {guideRequests.map((request) => (
                    <GuideRequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'custom-tours' && (
            <div>
              {customTourRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No custom tours yet</h3>
                  <p className="text-gray-500">Create your personalized Sri Lanka tour package!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customTourRequests.map((request) => (
                    <CustomTourRequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default AITrainingDashboard;