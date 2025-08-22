import React, { createContext, useContext, useState, useEffect } from 'react';

interface PlayHistoryItem {
  _id: string;
  songId: string;
  songTitle: string;
  artistName: string;
  albumName: string;
  duration: number;
  cover: string;
  preview: string;
  playedAt: string;
  completed: boolean;
}

interface PlayHistoryContextType {
  playHistory: PlayHistoryItem[];
  isLoading: boolean;
  loadPlayHistory: () => Promise<void>;
}

const PlayHistoryContext = createContext<PlayHistoryContextType | undefined>(undefined);

export const usePlayHistory = () => {
  const context = useContext(PlayHistoryContext);
  if (!context) {
    throw new Error('usePlayHistory must be used within a PlayHistoryProvider');
  }
  return context;
};

export const PlayHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  const loadPlayHistory = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlayHistory(data.playHistory);
      }
    } catch (error) {
      console.error('Failed to load play history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlayHistory();
    }
  }, [token]);

  // Auto-refresh play history periodically
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      loadPlayHistory();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [token]);

  // Refresh play history when a new song is played
  useEffect(() => {
    const handleStorageChange = () => {
      if (token) {
        loadPlayHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const value: PlayHistoryContextType = {
    playHistory,
    isLoading,
    loadPlayHistory,
  };

  return (
    <PlayHistoryContext.Provider value={value}>
      {children}
    </PlayHistoryContext.Provider>
  );
}; 