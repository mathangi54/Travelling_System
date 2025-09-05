import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';

const AITrainingDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [aiStatus, setAiStatus] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [pricingData, setPricingData] = useState(null);
  const [selectedTour, setSelectedTour] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authDebug, setAuthDebug] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  // Helper function to get authentication token
  const getAuthToken = () => {
    // Check multiple possible token storage keys
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  sessionStorage.getItem('token') || 
                  sessionStorage.getItem('authToken');
    
    console.log('Retrieved token:', token ? 'Token found' : 'No token found');
    return token;
  };

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const requestOptions = {
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    console.log('Making request to:', url);
    console.log('With options:', requestOptions);

    const response = await fetch(url, requestOptions);
    
    // Handle token expiration
    if (response.status === 401) {
      console.log('Token expired or invalid, logging out...');
      logout();
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  };

  // Check AI model status and get training history
  const checkAIStatus = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/ai-status`);
      const data = await response.json();
      
      if (response.ok) {
        setAiStatus(data.data);
        
        // If training results exist, format them for charts
        if (data.data.training_results) {
          const history = data.data.training_results;
          setTrainingHistory(history);
        }
        
        console.log('AI Status loaded successfully:', data.data);
      } else {
        setError(data.message || 'Failed to fetch AI status');
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setError('Failed to connect to AI service');
    }
  };

  // Start model training
  const startTraining = async () => {
    setTrainingStatus('training');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/train-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTrainingStatus('completed');
        await checkAIStatus(); // Refresh AI status and get training history
        alert('Training completed successfully!');
      } else {
        setTrainingStatus('failed');
        setError(data.message || 'Training failed');
        alert(`Training failed: ${data.message}`);
      }
    } catch (error) {
      setTrainingStatus('failed');
      setError('Training failed due to network error');
      console.error('Training error:', error);
      alert('Training failed due to network error');
    } finally {
      setLoading(false);
    }
  };

  // Get AI recommendations
  const getAIRecommendations = async () => {
    if (!currentUser) {
      alert('Please login to get AI recommendations');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setAuthDebug('Token missing from localStorage/sessionStorage');
        return;
      }

      setAuthDebug(`Token found, making request for user: ${currentUser?.username || currentUser?.id}`);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/ai-recommendations`);
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data.data.tours || []);
        setAuthDebug('Recommendations loaded successfully');
        console.log('AI Recommendations loaded:', data.data);
      } else {
        setError(data.message || 'Failed to get recommendations');
        setAuthDebug(`API Error: ${response.status} - ${data.message}`);
        
        if (response.status === 503) {
          alert('AI models not loaded. Please train models first.');
        } else if (response.status === 401) {
          alert('Authentication failed. Please login again.');
        }
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setError(error.message || 'Failed to get recommendations');
      setAuthDebug(`Network Error: ${error.message}`);
      
      if (error.message.includes('Authentication expired')) {
        alert('Your session has expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get AI pricing
  const getAIPricing = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        tour_id: selectedTour,
        user_id: currentUser?.id || 1,
        guests: 2,
        travel_date: '2024-12-15'
      };

      console.log('AI Pricing request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/ai-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPricingData(data.data);
        setError(null);
        console.log('AI Pricing loaded:', data.data);
      } else {
        setError(data.message || 'Failed to get AI pricing');
        if (response.status === 503) {
          alert('AI models not loaded. Please train models first.');
        }
      }
    } catch (error) {
      console.error('Error getting AI pricing:', error);
      setError('Failed to get AI pricing');
    } finally {
      setLoading(false);
    }
  };

  // Debug auth state
  const debugAuthState = () => {
    const token = getAuthToken();
    const debugInfo = {
      currentUser: currentUser,
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      localStorage_token: !!localStorage.getItem('token'),
      localStorage_authToken: !!localStorage.getItem('authToken'),
      sessionStorage_token: !!sessionStorage.getItem('token'),
      sessionStorage_authToken: !!sessionStorage.getItem('authToken')
    };
    
    console.log('Auth Debug Info:', debugInfo);
    setAuthDebug(JSON.stringify(debugInfo, null, 2));
    alert('Check console for auth debug info');
  };

  // Format training history for charts
  const getTrainingProgressData = () => {
    if (!trainingHistory) return [];
    
    // If we have recommendation accuracy array from training
    if (trainingHistory.recommendation_accuracy) {
      return trainingHistory.recommendation_accuracy.map((accuracy, index) => ({
        epoch: index + 1,
        accuracy: accuracy,
        time: trainingHistory.epoch_times ? trainingHistory.epoch_times[index] : 0
      }));
    }
    
    return [];
  };

  useEffect(() => {
    checkAIStatus();
    
    // Debug auth state on mount
    const token = getAuthToken();
    console.log('Component mounted. Current user:', currentUser);
    console.log('Token available:', !!token);
  }, [currentUser]);

  const trainingProgressData = getTrainingProgressData();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Training Dashboard</h1>
              <p className="text-gray-600">Manage and monitor your AI-powered tour recommendation system</p>
              {currentUser && (
                <p className="text-sm text-blue-600 mt-1">
                  Logged in as: {currentUser.username || currentUser.email}
                </p>
              )}
            </div>
            <div className="text-right">
              <button
                onClick={debugAuthState}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-2"
              >
                Debug Auth
              </button>
              {currentUser && (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {authDebug && (
            <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <strong>Auth Debug:</strong>
              <pre className="text-xs mt-2 whitespace-pre-wrap">{authDebug}</pre>
            </div>
          )}
          
          {!currentUser && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <strong>Authentication Required:</strong> Please login to access AI recommendations feature.
            </div>
          )}
        </div>

        {/* AI Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              aiStatus?.models_loaded 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {aiStatus?.models_loaded ? 'Models Loaded' : 'Models Not Loaded'}
            </div>
            {trainingHistory?.best_accuracy && (
              <p className="mt-2 text-sm text-gray-600">
                Best Accuracy: {(trainingHistory.best_accuracy * 100).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Training Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              trainingStatus === 'completed' ? 'bg-green-100 text-green-800' :
              trainingStatus === 'training' ? 'bg-yellow-100 text-yellow-800' :
              trainingStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {trainingStatus === 'training' ? 'Training...' : 
               trainingStatus === 'completed' ? 'Completed' :
               trainingStatus === 'failed' ? 'Failed' : 'Ready'}
            </div>
            {trainingHistory?.best_epoch && (
              <p className="mt-2 text-sm text-gray-600">
                Best Epoch: {trainingHistory.best_epoch}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Features</h3>
            <p className="text-2xl font-bold text-blue-600">{aiStatus?.feature_count || 0}</p>
            <p className="text-sm text-gray-600">Training features</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Models</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recommendation</span>
                <span className={`w-3 h-3 rounded-full ${aiStatus?.available_models?.recommendation ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pricing</span>
                <span className={`w-3 h-3 rounded-full ${aiStatus?.available_models?.pricing ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Segmentation</span>
                <span className={`w-3 h-3 rounded-full ${aiStatus?.available_models?.segmentation ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
            </div>
          </div>
        </div>

        {/* Training Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Training Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startTraining}
              disabled={trainingStatus === 'training' || loading}
              className={`px-6 py-2 rounded-lg font-medium ${
                trainingStatus === 'training' || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {trainingStatus === 'training' ? 'Training...' : 'Start Training'}
            </button>
            
            <button
              onClick={checkAIStatus}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300"
            >
              Refresh Status
            </button>

            <button
              onClick={getAIRecommendations}
              disabled={!aiStatus?.models_loaded || loading || !currentUser}
              className={`px-6 py-2 rounded-lg font-medium ${
                !aiStatus?.models_loaded || loading || !currentUser
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              Get AI Recommendations
              {!currentUser && ' (Login Required)'}
            </button>

            <button
              onClick={getAIPricing}
              disabled={!aiStatus?.models_loaded || loading}
              className={`px-6 py-2 rounded-lg font-medium ${
                !aiStatus?.models_loaded || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              Get AI Pricing
            </button>
          </div>
        </div>

        {/* Training Progress Charts - Only show if we have real data */}
        {trainingProgressData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Training Progress (Accuracy)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trainingProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Training Time per Epoch</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trainingProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="time" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">AI Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((tour) => (
                <div key={tour.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <img 
                    src={tour.image_url || 'https://via.placeholder.com/300x200'} 
                    alt={tour.name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Tour+Image';
                    }}
                  />
                  <h3 className="font-semibold text-lg mb-2">{tour.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tour.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Original Price:</span>
                      <span className="text-lg font-bold text-gray-800">${tour.price}</span>
                    </div>
                    
                    {tour.ai_suggested_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">AI Suggested:</span>
                        <span className="text-lg font-bold text-green-600">${tour.ai_suggested_price}</span>
                      </div>
                    )}
                    
                    {tour.ai_score && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">AI Score:</span>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {(tour.ai_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    
                    {tour.recommendation_reason && (
                      <div className="text-xs text-gray-500 mt-2">
                        {tour.recommendation_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Pricing Analysis */}
        {pricingData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">AI Pricing Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Base Price</h3>
                <p className="text-2xl font-bold text-gray-800">${pricingData.base_price}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">AI Suggested</h3>
                <p className="text-2xl font-bold text-blue-600">${pricingData.ai_suggested_price}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Final Price</h3>
                <p className="text-2xl font-bold text-green-600">${pricingData.final_price}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Per Person</h3>
                <p className="text-2xl font-bold text-purple-600">${pricingData.price_per_person}</p>
              </div>
            </div>
            
            {pricingData.pricing_insights && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Purchase Probability</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${pricingData.pricing_insights.purchase_probability * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {(pricingData.pricing_insights.purchase_probability * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Seasonal Factor</h4>
                  <p className="text-xl font-bold">{pricingData.pricing_insights.seasonal_multiplier}x</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Demand Factor</h4>
                  <p className="text-xl font-bold">{pricingData.pricing_insights.demand_multiplier}x</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dataset Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dataset Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Total Records</h3>
              <p className="text-2xl font-bold text-blue-600">4,888</p>
              <p className="text-sm text-gray-600">Customer records</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Features</h3>
              <p className="text-2xl font-bold text-green-600">20</p>
              <p className="text-sm text-gray-600">Input features</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Conversion Rate</h3>
              <p className="text-2xl font-bold text-purple-600">18.4%</p>
              <p className="text-sm text-gray-600">Purchase rate</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Model Accuracy</h3>
              <p className="text-2xl font-bold text-orange-600">
                {trainingHistory?.best_accuracy ? 
                  `${(trainingHistory.best_accuracy * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </p>
              <p className="text-sm text-gray-600">Best prediction accuracy</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-3">Key Features Used in Training:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                'Age', 'CityTier', 'MonthlyIncome', 'Occupation', 'Gender',
                'NumberOfPersonVisiting', 'PreferredPropertyStar', 'NumberOfTrips',
                'Passport', 'OwnCar', 'NumberOfFollowups', 'ProductPitched',
                'PitchSatisfactionScore', 'MaritalStatus', 'DurationOfPitch', 'Designation'
              ].map((feature) => (
                <div key={feature} className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          
          {/* Training Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Training Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Ensure 'tour_package.csv' is in your backend directory</li>
              <li>Login to your account to access AI recommendations</li>
              <li>Click 'Start Training' to train the AI models with your dataset</li>
              <li>Monitor the training progress and accuracy metrics</li>
              <li>Once training is complete, test AI recommendations and pricing</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITrainingDashboard;