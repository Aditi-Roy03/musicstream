import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Clock, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchHistory {
  _id: string;
  query: string;
  timestamp: string;
}

const SearchHistory = () => {
  const navigate = useNavigate();
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchSearchHistory();
    }
  }, [token]);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/search/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearchHistory = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/search/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSearchHistory(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete search history:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const handleSearchClick = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Search History</h1>
            <p className="text-gray-400">Your recent search queries</p>
          </div>
        </div>
      </div>

      {/* Search History List */}
      {loading ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading search history...</p>
        </div>
      ) : searchHistory.length === 0 ? (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">No search history yet</h3>
          <p className="text-gray-400 mb-4">Start searching for music to see your history here</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-full font-medium transition-colors"
          >
            Start Searching
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {searchHistory.map((item) => (
            <div 
              key={item._id} 
              className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 group cursor-pointer transition-all duration-200"
            >
              <div 
                className="flex items-center flex-1"
                onClick={() => handleSearchClick(item.query)}
              >
                <SearchIcon className="h-5 w-5 text-gray-400 mr-4" />
                <div className="flex-1">
                  <p className="font-medium">{item.query}</p>
                  <p className="text-gray-400 text-sm">{formatDate(item.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSearchHistory(item._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistory; 