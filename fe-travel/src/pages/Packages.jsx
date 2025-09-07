import React, { useState, useEffect } from 'react';
import PackageCard from '../components/PackageCard';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { popularPackages } from '../data/packageData'; // Import static data as fallback

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingStaticData, setUsingStaticData] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { currentUser } = useAuth();

  const API_BASE_URL = 'http://localhost:5000/api';

  // Price validation function
  const validatePrice = (price) => {
    if (!price || price < 4000 || price > 50000) {
      return Math.floor(Math.random() * 46000) + 4000; // Rs. 4000 - Rs. 50000
    }
    return price;
  };

  // Generate discount price within range
  const generateDiscountPrice = (originalPrice) => {
    const minDiscountPrice = 4000;
    const maxDiscountPercent = Math.floor(((originalPrice - minDiscountPrice) / originalPrice) * 100);
    
    if (maxDiscountPercent < 10) {
      const discountPercent = Math.floor(Math.random() * 10) + 5; // 5-15% discount
      return Math.floor(originalPrice * (1 - discountPercent / 100));
    }
    
    const discountPercent = Math.floor(Math.random() * Math.min(maxDiscountPercent, 70)) + 10; // 10-70% discount
    const discountedPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
    return Math.max(discountedPrice, 4000);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingStaticData(false);
      
      const response = await fetch(`${API_BASE_URL}/tours`);
      const data = await response.json();
      
      if (response.ok && data.data && data.data.length > 0) {
        // Successfully got data from API
        const enhancedPackages = data.data.map(pkg => {
          const validatedPrice = validatePrice(pkg.price);
          const shouldHaveDiscount = Math.random() < 0.8; // 80% chance of discount
          let discountPrice = null;
          
          if (pkg.discount_price) {
            // Validate existing discount price
            if (pkg.discount_price >= 4000 && pkg.discount_price <= 50000 && pkg.discount_price < validatedPrice) {
              discountPrice = pkg.discount_price;
            }
          }
          
          // Generate discount if needed
          if (!discountPrice && shouldHaveDiscount) {
            discountPrice = generateDiscountPrice(validatedPrice);
          }
          
          return {
            ...pkg,
            image_url: pkg.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
            location: pkg.location || 'Sri Lanka',
            rating: pkg.rating || (Math.random() * 2 + 3).toFixed(1),
            reviews: pkg.reviews || Math.floor(Math.random() * 500) + 50,
            duration_days: pkg.duration_days || Math.floor(Math.random() * 10) + 3,
            price: validatedPrice,
            discount_price: discountPrice
          };
        });
        
        setPackages(enhancedPackages);
        console.log('Successfully loaded packages from API:', enhancedPackages.length);
      } else {
        // API failed or returned no data, use static data
        console.warn('API returned no data, using static Sri Lankan packages');
        const enhancedStaticPackages = popularPackages.map(pkg => {
          const validatedPrice = validatePrice(pkg.price);
          const shouldHaveDiscount = Math.random() < 0.8;
          let discountPrice = null;
          
          if (pkg.discount_price) {
            if (pkg.discount_price >= 4000 && pkg.discount_price <= 50000 && pkg.discount_price < validatedPrice) {
              discountPrice = pkg.discount_price;
            }
          }
          
          if (!discountPrice && shouldHaveDiscount) {
            discountPrice = generateDiscountPrice(validatedPrice);
          }
          
          return {
            ...pkg,
            price: validatedPrice,
            discount_price: discountPrice
          };
        });
        
        setPackages(enhancedStaticPackages);
        setUsingStaticData(true);
        setError('Connected to static Sri Lankan packages. Start your backend and refresh for live data.');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      console.warn('API connection failed, using static Sri Lankan packages');
      
      const enhancedStaticPackages = popularPackages.map(pkg => {
        const validatedPrice = validatePrice(pkg.price);
        const shouldHaveDiscount = Math.random() < 0.8;
        let discountPrice = null;
        
        if (pkg.discount_price) {
          if (pkg.discount_price >= 4000 && pkg.discount_price <= 50000 && pkg.discount_price < validatedPrice) {
            discountPrice = pkg.discount_price;
          }
        }
        
        if (!discountPrice && shouldHaveDiscount) {
          discountPrice = generateDiscountPrice(validatedPrice);
        }
        
        return {
          ...pkg,
          price: validatedPrice,
          discount_price: discountPrice
        };
      });
      
      setPackages(enhancedStaticPackages);
      setUsingStaticData(true);
      setError('Using offline Sri Lankan packages. To get live data, ensure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async (packageId, isWishlisted) => {
    if (!currentUser) {
      alert('Please login to manage your wishlist');
      return;
    }
    
    if (usingStaticData) {
      // Handle wishlist for static data locally
      setPackages(packages.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, is_wishlisted: isWishlisted }
          : pkg
      ));
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tour_id: packageId })
      });

      if (response.ok) {
        setPackages(packages.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, is_wishlisted: isWishlisted }
            : pkg
        ));
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const filteredAndSortedPackages = packages
    .filter(pkg => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!pkg.name.toLowerCase().includes(search) && 
            !pkg.description.toLowerCase().includes(search) &&
            !pkg.location.toLowerCase().includes(search) &&
            !(pkg.tour_type || '').toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Get display price (discount price if available, otherwise regular price)
      const displayPrice = pkg.discount_price || pkg.price;
      
      // Price filter (adjusted for Rs. 4000-50,000 range)
      if (filter === 'budget') return displayPrice < 15000;
      if (filter === 'mid-range') return displayPrice >= 15000 && displayPrice < 30000;
      if (filter === 'luxury') return displayPrice >= 30000;
      
      // Duration filter
      if (filter === 'short') return pkg.duration_days <= 5;
      if (filter === 'medium') return pkg.duration_days > 5 && pkg.duration_days <= 10;
      if (filter === 'long') return pkg.duration_days > 10;
      
      // Region filter
      if (filter === 'coastal') return pkg.region === 'coastal';
      if (filter === 'cultural') return pkg.region === 'cultural';
      if (filter === 'hill-country') return pkg.region === 'hill country';
      if (filter === 'wildlife') return pkg.region === 'wilderness';
      
      return true;
    })
    .sort((a, b) => {
      // Use display price for sorting
      const priceA = a.discount_price || a.price;
      const priceB = b.discount_price || b.price;
      
      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'duration':
          return (b.duration_days || 0) - (a.duration_days || 0);
        case 'rating':
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Sri Lankan packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Sri Lankan Travel Packages</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the Pearl of the Indian Ocean with our curated Sri Lankan travel experiences
            </p>
            {usingStaticData && (
              <div className="mt-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded inline-block">
                <p className="text-sm">
                  📱 Showing curated Sri Lankan packages. 
                  <button 
                    onClick={fetchPackages}
                    className="ml-2 underline hover:no-underline"
                  >
                    Try connecting to live data
                  </button>
                </p>
              </div>
            )}
            {error && !usingStaticData && (
              <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded inline-block">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Sri Lankan destinations, experiences, or regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedPackages.length} of {packages.length} Sri Lankan packages
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <optgroup label="By Price">
                    <option value="budget">Budget (Under Rs. 15,000)</option>
                    <option value="mid-range">Mid-range (Rs. 15,000 - Rs. 30,000)</option>
                    <option value="luxury">Luxury (Rs. 30,000+)</option>
                  </optgroup>
                  <optgroup label="By Duration">
                    <option value="short">Short Trips (≤5 days)</option>
                    <option value="medium">Medium Trips (6-10 days)</option>
                    <option value="long">Long Trips (10+ days)</option>
                  </optgroup>
                  <optgroup label="By Region">
                    <option value="coastal">Coastal & Beaches</option>
                    <option value="cultural">Cultural & Heritage</option>
                    <option value="hill-country">Hill Country & Tea</option>
                    <option value="wildlife">Wildlife & Safari</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="duration">Duration</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilter('all');
                    setSortBy('name');
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* No Results */}
        {filteredAndSortedPackages.length === 0 && packages.length > 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Sri Lankan packages found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSortBy('name');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {filteredAndSortedPackages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPackages.map((packageItem) => (
              <PackageCard
                key={packageItem.id}
                packageItem={packageItem}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredAndSortedPackages.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Showing all {filteredAndSortedPackages.length} Sri Lankan packages
              {usingStaticData && ' (curated collection)'}
            </p>
            {usingStaticData && (
              <div className="space-x-4">
                <button
                  onClick={fetchPackages}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Try Live Data Connection
                </button>
                <a
                  href="http://localhost:5000/api/seed-sri-lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium inline-block"
                >
                  Seed Backend Data
                </a>
              </div>
            )}
          </div>
        )}

        {/* Sri Lankan Regions Info */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Explore Sri Lanka by Region</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                 onClick={() => setFilter('coastal')}>
              <div className="text-3xl mb-2">🏖️</div>
              <h3 className="font-semibold text-blue-800 mb-2">Coastal & Beaches</h3>
              <p className="text-sm text-gray-600">Pristine beaches, whale watching, and coastal adventures</p>
              <div className="mt-2 text-xs text-gray-500">
                Mirissa • Unawatuna • Arugam Bay • Trincomalee
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition"
                 onClick={() => setFilter('cultural')}>
              <div className="text-3xl mb-2">🛕</div>
              <h3 className="font-semibold text-orange-800 mb-2">Cultural & Heritage</h3>
              <p className="text-sm text-gray-600">Ancient cities, temples, and UNESCO World Heritage sites</p>
              <div className="mt-2 text-xs text-gray-500">
                Kandy • Sigiriya • Anuradhapura • Polonnaruwa
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition"
                 onClick={() => setFilter('hill-country')}>
              <div className="text-3xl mb-2">⛰️</div>
              <h3 className="font-semibold text-green-800 mb-2">Hill Country & Tea</h3>
              <p className="text-sm text-gray-600">Misty mountains, tea plantations, and cool climate</p>
              <div className="mt-2 text-xs text-gray-500">
                Ella • Nuwara Eliya • Bandarawela • Haputale
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition"
                 onClick={() => setFilter('wildlife')}>
              <div className="text-3xl mb-2">🦌</div>
              <h3 className="font-semibold text-yellow-800 mb-2">Wildlife & Safari</h3>
              <p className="text-sm text-gray-600">National parks, leopards, elephants, and bird watching</p>
              <div className="mt-2 text-xs text-gray-500">
                Yala • Udawalawe • Minneriya • Wilpattu
              </div>
            </div>
          </div>
        </div>

        {/* Backend Connection Instructions */}
        {usingStaticData && (
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Connect to Backend for Live Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">For Developers:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Start your Flask backend: <code className="bg-gray-200 px-1 rounded">python app.py</code></li>
                  <li>Visit: <a href="http://localhost:5000/api/seed-sri-lanka" className="text-blue-600 hover:underline">http://localhost:5000/api/seed-sri-lanka</a></li>
                  <li>Refresh this page to see live data</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Features with Backend:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>AI-powered recommendations</li>
                  <li>Dynamic pricing optimization</li>
                  <li>Real-time booking system</li>
                  <li>User authentication & profiles</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Packages;