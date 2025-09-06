import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminGuideRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    request_type: '',
    guide_id: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter.status) params.append('status', filter.status);
      if (filter.request_type) params.append('request_type', filter.request_type);
      if (filter.guide_id) params.append('guide_id', filter.guide_id);

      const response = await fetch(`${API_BASE_URL}/guide-requests?${params}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/guide-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        fetchRequests(); // Refresh the list
        alert('Status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced language display function - only Tamil, English, Sinhala
  const formatLanguages = (languages) => {
    if (!languages) return 'English';
    
    const langArray = Array.isArray(languages) ? languages : JSON.parse(languages || '["English"]');
    
    // Filter to only show Tamil, English, Sinhala
    const validLanguages = langArray.filter(lang => 
      ['Tamil', 'English', 'Sinhala'].includes(lang)
    );
    
    return validLanguages.length > 0 ? validLanguages.join(', ') : 'English';
  };

  const RequestDetailsModal = ({ request, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
            <p className="text-sm text-gray-600">ID: {request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{request.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{request.customer_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{request.customer_phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Request Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  request.request_type === 'booking' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {request.request_type}
                </span>
              </div>
            </div>
          </div>

          {/* Guide Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Guide Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Guide Name</label>
                <p className="text-gray-900">{request.guide_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Guide Email</label>
                <p className="text-gray-900">{request.guide_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Guide Phone</label>
                <p className="text-gray-900">{request.guide_phone}</p>
              </div>
              {request.guide_languages && (
                <div className="md:col-span-3">
                  <label className="text-sm font-medium text-gray-600">Languages</label>
                  <p className="text-gray-900">{formatLanguages(request.guide_languages)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details (if booking request) */}
          {request.request_type === 'booking' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.preferred_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Date</label>
                    <p className="text-gray-900">{new Date(request.preferred_date).toLocaleDateString()}</p>
                  </div>
                )}
                {request.duration && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-gray-900">{request.duration}</p>
                  </div>
                )}
                {request.group_size && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Group Size</label>
                    <p className="text-gray-900">{request.group_size}</p>
                  </div>
                )}
                {request.tour_type && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tour Type</label>
                    <p className="text-gray-900">{request.tour_type}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{request.message}</p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Status & Actions</h3>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-600">Current Status</label>
                <div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Update Status</label>
                <select
                  value={request.status}
                  onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                  className="ml-2 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <label className="font-medium">Created At</label>
              <p>{formatDate(request.created_at)}</p>
            </div>
            <div>
              <label className="font-medium">Last Updated</label>
              <p>{formatDate(request.updated_at || request.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Guide Requests Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage contact and booking requests from customers
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
              <select
                value={filter.request_type}
                onChange={(e) => setFilter({...filter, request_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="contact">Contact</option>
                <option value="booking">Booking</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilter({status: '', request_type: '', guide_id: ''})}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'contacted').length}
              </div>
              <div className="text-sm text-gray-600">Contacted</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {requests.filter(r => r.request_type === 'booking').length}
              </div>
              <div className="text-sm text-gray-600">Bookings</div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Requests ({requests.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No requests found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guide
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.customer_email}
                          </div>
                          {request.customer_phone && (
                            <div className="text-sm text-gray-500">
                              {request.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.guide_name}
                        </div>
                        {request.guide_languages && (
                          <div className="text-xs text-gray-500">
                            {formatLanguages(request.guide_languages)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.request_type === 'booking' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.request_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.preferred_date && (
                          <div>Date: {new Date(request.preferred_date).toLocaleDateString()}</div>
                        )}
                        {request.duration && (
                          <div>Duration: {request.duration}</div>
                        )}
                        {request.group_size && (
                          <div>Group: {request.group_size}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
                          <select
                            value={request.status}
                            onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
        />
      )}
    </div>
  );
};

export default AdminGuideRequests;