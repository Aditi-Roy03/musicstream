
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, Clock, Play, Heart, X, Plus } from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import AddToPlaylistDialog from '../components/AddToPlaylistDialog';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  preview: string;
  cover: string;
  artistPicture: string;
  link: string;
}

interface SearchHistory {
  _id: string;
  query: string;
  timestamp: string;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { playSong, setCurrentSongList } = useMusicPlayer();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchSearchHistory();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    }
  };

  const deleteSearchHistory = async (id: string) => {
    try {
      console.log('Attempting to delete search history item:', id);
      const response = await fetch(`http://localhost:3001/api/search/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('Successfully deleted item from backend');
        setSearchHistory(prev => prev.filter(item => item._id !== id));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete search history:', errorData);
      }
    } catch (error) {
      console.error('Failed to delete search history:', error);
    }
  };

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3001/api/songs/search?q=${encodeURIComponent(searchQuery)}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on song ID
        const uniqueSongs = data.songs.filter((song: any, index: number, self: any[]) => 
          index === self.findIndex((s: any) => s.id === song.id)
        );
        setSongs(uniqueSongs);
        setShowHistory(false);
        
        if (token) {
          fetchSearchHistory();
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSongs(query);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSongList(songs, song.id);
    playSong(song);
  };

  const handleToggleFavorite = async (song: Song) => {
    if (!token) return;
    
    const songId = song.id.toString();
    if (isFavorite(songId)) {
      await removeFromFavorites(songId);
    } else {
      await addToFavorites(song);
    }
  };

  const handleAddToPlaylist = (song: Song) => {
    setSelectedSong(song);
    setShowAddToPlaylist(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Music</h1>
        <p className="text-gray-400">Discover your favorite songs and artists</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl" ref={searchRef}>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchSongs(query);
                  setShowHistory(false);
                }
              }}
              className="h-14 pl-12 pr-4 text-lg bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg focus:border-white/40 focus:bg-white/20 transition-all duration-200"
              onFocus={() => setShowHistory(true)}
            />
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate('/search-history');
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Show all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 hover:bg-white/10 rounded-lg cursor-pointer group transition-all duration-200"
                        onClick={() => {
                          setQuery(item.query);
                          searchSongs(item.query);
                          setShowHistory(false);
                        }}
                      >
                        <span className="truncate text-white font-medium">{item.query}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSearchHistory(item._id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 h-10 px-6 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all duration-200"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>



            {songs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Search Results</h2>
            <span className="text-gray-400 text-sm font-medium">
              {songs.length} songs found
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {songs.map((song) => (
              <div key={song.id} className="group relative bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all duration-300">
                <div className="relative">
                  <img
                    src={song.cover}
                    alt={song.album}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                      onClick={() => handlePlaySong(song)}
                    >
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                        isFavorite(song.id.toString()) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(song);
                      }}
                    >
                      <Heart size={16} fill={isFavorite(song.id.toString()) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white/20 text-white hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(song);
                      }}
                      title="Add to playlist"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-white truncate mb-1">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 text-sm truncate mb-1">
                    {song.artist}
                  </p>
                  <p className="text-gray-400 text-xs truncate mb-3">
                    {song.album}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {formatDuration(song.duration)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-gray-400 text-xs">Preview</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {songs.length === 0 && !loading && query && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No songs found</h3>
          <p className="text-gray-400 text-lg">Try searching for something else</p>
        </div>
      )}

      {/* Add to Playlist Dialog */}
      {selectedSong && (
        <AddToPlaylistDialog
          isOpen={showAddToPlaylist}
          onClose={() => {
            setShowAddToPlaylist(false);
            setSelectedSong(null);
          }}
          song={selectedSong}
        />
      )}
    </div>
  );
};

export default Search;
