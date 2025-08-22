import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  totalDuration: number;
  songCount: number;
  tags: string[];
  songs?: PlaylistSong[];
}

interface PlaylistSong {
  _id: string;
  playlistId: string;
  songId: string;
  songTitle: string;
  artistName: string;
  albumName: string;
  duration: number;
  cover: string;
  preview: string;
  addedBy: string;
  addedAt: string;
  position: number;
}

interface PlaylistContextType {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  currentPlaylistSongs: PlaylistSong[];
  isLoading: boolean;
  error: string | null;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  getPlaylistDetails: (playlistId: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: any) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
  clearError: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
};

interface PlaylistProviderProps {
  children: ReactNode;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentPlaylistSongs, setCurrentPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:3001/api/playlists', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        throw new Error('Failed to fetch playlists');
      }

      const data = await response.json();
      setPlaylists(data.playlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const createPlaylist = useCallback(async (name: string, description: string = '', isPublic: boolean = false): Promise<Playlist> => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:3001/api/playlists', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description, isPublic })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create playlist');
      }

      const data = await response.json();
      const newPlaylist = data.playlist;
      
      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist';
      setError(errorMessage);
      throw err;
    }
  }, [getAuthHeaders]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete playlist');
      }

      setPlaylists(prev => prev.filter(playlist => playlist._id !== playlistId));
      
      // Clear current playlist if it was deleted
      if (currentPlaylist?._id === playlistId) {
        setCurrentPlaylist(null);
        setCurrentPlaylistSongs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(errorMessage);
      throw err;
    }
  }, [currentPlaylist, getAuthHeaders]);

  const getPlaylistDetails = useCallback(async (playlistId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        if (response.status === 404) {
          setError('Playlist not found');
          return;
        }
        throw new Error('Failed to fetch playlist details');
      }

      const data = await response.json();
      setCurrentPlaylist(data.playlist);
      setCurrentPlaylistSongs(data.songs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlist details');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const addSongToPlaylist = useCallback(async (playlistId: string, song: any) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          songId: song.id || song.songId,
          songTitle: song.title || song.songTitle,
          artistName: song.artist || song.artistName,
          albumName: song.album || song.albumName,
          duration: song.duration,
          cover: song.cover,
          preview: song.preview
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add song to playlist');
      }

      // Update current playlist songs if we're viewing this playlist
      if (currentPlaylist?._id === playlistId) {
        const data = await response.json();
        setCurrentPlaylistSongs(prev => [...prev, data.playlistSong]);
      }

      // Update playlist song count in the list
      setPlaylists(prev => prev.map(playlist => 
        playlist._id === playlistId 
          ? { ...playlist, songCount: playlist.songCount + 1 }
          : playlist
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add song to playlist';
      setError(errorMessage);
      throw err;
    }
  }, [currentPlaylist, getAuthHeaders]);

  const removeSongFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove song from playlist');
      }

      // Update current playlist songs if we're viewing this playlist
      if (currentPlaylist?._id === playlistId) {
        setCurrentPlaylistSongs(prev => prev.filter(song => song.songId !== songId));
      }

      // Update playlist song count in the list
      setPlaylists(prev => prev.map(playlist => 
        playlist._id === playlistId 
          ? { ...playlist, songCount: Math.max(0, playlist.songCount - 1) }
          : playlist
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove song from playlist';
      setError(errorMessage);
      throw err;
    }
  }, [currentPlaylist, getAuthHeaders]);

  const updatePlaylist = useCallback(async (playlistId: string, updates: Partial<Playlist>) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update playlist');
      }

      const data = await response.json();
      const updatedPlaylist = data.playlist;

      // Update playlist in the list
      setPlaylists(prev => prev.map(playlist => 
        playlist._id === playlistId ? updatedPlaylist : playlist
      ));

      // Update current playlist if we're viewing it
      if (currentPlaylist?._id === playlistId) {
        setCurrentPlaylist(updatedPlaylist);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(errorMessage);
      throw err;
    }
  }, [currentPlaylist, getAuthHeaders]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check authentication on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPlaylists();
      // Clear current playlist when token changes (new user login)
      setCurrentPlaylist(null);
      setCurrentPlaylistSongs([]);
    } else {
      // Clear all data when no token (logout)
      setPlaylists([]);
      setCurrentPlaylist(null);
      setCurrentPlaylistSongs([]);
      setError(null);
    }
  }, [fetchPlaylists]);

  // Listen for storage changes (logout/login)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // New login - fetch playlists
          fetchPlaylists();
          setCurrentPlaylist(null);
          setCurrentPlaylistSongs([]);
        } else {
          // Logout - clear data
          setPlaylists([]);
          setCurrentPlaylist(null);
          setCurrentPlaylistSongs([]);
          setError(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchPlaylists]);

  const value: PlaylistContextType = {
    playlists,
    currentPlaylist,
    currentPlaylistSongs,
    isLoading,
    error,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    getPlaylistDetails,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist,
    clearError
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}; 