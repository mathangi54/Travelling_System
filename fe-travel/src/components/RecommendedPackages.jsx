import React, { useState, useEffect } from 'react';
import PackageCard from './PackageCard';
import { useAuth } from '../context/AuthContext';

const RecommendedPackages = () => {
  const [recommendedPackages, setRecommendedPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser]);

  const fetchRecommendations = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedPackages(data.data || []);
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Error fetching recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Don't show recommendations for non-logged in users
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Personalized Recommendations
        </h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Personalized Recommendations
        </h2>
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (recommendedPackages.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Personalized Recommendations</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Based on your preferences and similar travelers' choices
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedPackages.map((pkg) => (
          <div key={pkg.id} className="px-3 py-4">
            <PackageCard packageItem={pkg} isRecommended={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPackages;