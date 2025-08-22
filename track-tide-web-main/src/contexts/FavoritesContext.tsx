import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoriteSong {
  _id: string;
  songId: string;
  songTitle: string;
  artistName: string;
  albumName: string;
  duration: number;
  cover: string;
  preview: string;
  likedAt: string;
  context: string;
}

interface FavoritesContextType {
  favorites: FavoriteSong[];
  isLoading: boolean;
  addToFavorites: (song: any) => Promise<boolean>;
  removeFromFavorites: (songId: string) => Promise<boolean>;
  isFavorite: (songId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  const loadFavorites = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFavorites();
    }
  }, [token]);

  const addToFavorites = async (song: any): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:3001/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          songId: song.id.toString(),
          songTitle: song.title,
          artistName: song.artist,
          albumName: song.album,
          duration: song.duration,
          cover: song.cover,
          preview: song.preview,
          context: 'search'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(prev => [data.favorite, ...prev]);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to add to favorites:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (songId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`http://localhost:3001/api/favorites/${songId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.songId !== songId));
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to remove from favorites:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    }
  };

  const isFavorite = (songId: string): boolean => {
    return favorites.some(fav => fav.songId === songId.toString());
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}; 