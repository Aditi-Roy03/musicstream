
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Heart, MoreHorizontal, Music, Trash2, Edit3, Clock, User, X } from 'lucide-react';
import { usePlaylists } from '../contexts/PlaylistContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from '../hooks/use-toast';

const Playlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playlists, currentPlaylist, currentPlaylistSongs, isLoading, error, fetchPlaylists, createPlaylist, deletePlaylist, getPlaylistDetails, removeSongFromPlaylist } = usePlaylists();
  const { playSong, setCurrentSongList, currentSong } = useMusicPlayer();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }
    fetchPlaylists();
  }, [navigate, fetchPlaylists]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
      
      // Select the newly created playlist
      setSelectedPlaylistId(newPlaylist._id);
      await getPlaylistDetails(newPlaylist._id);
      
      toast({
        title: "Success",
        description: `Playlist "${newPlaylist.name}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create playlist",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlaylistSelect = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    await getPlaylistDetails(playlistId);
  };

  const handlePlaySong = (song: any) => {
    if (!song.preview) {
      toast({
        title: "Error",
        description: "Song preview not available",
        variant: "destructive"
      });
      return;
    }
    
    setPlayingSongId(song.songId);
    
    const songData = {
      id: parseInt(song.songId),
      title: song.songTitle,
      artist: song.artistName,
      album: song.albumName,
      duration: song.duration,
      preview: song.preview,
      cover: song.cover,
      artistPicture: song.cover,
      link: ''
    };
    
    // Convert playlist songs to song format for queue
    const songList = currentPlaylistSongs.map((playlistSong: any) => ({
      id: parseInt(playlistSong.songId),
      title: playlistSong.songTitle,
      artist: playlistSong.artistName,
      album: playlistSong.albumName,
      duration: playlistSong.duration,
      preview: playlistSong.preview,
      cover: playlistSong.cover,
      artistPicture: playlistSong.cover,
      link: ''
    }));
    
    setCurrentSongList(songList, parseInt(song.songId));
    playSong(songData);
    
    setTimeout(() => setPlayingSongId(null), 1000);
  };

  const handlePlayAllSongs = () => {
    if (currentPlaylistSongs.length === 0) return;
    
    const firstSong = currentPlaylistSongs[0];
    handlePlaySong(firstSong);
  };

  const handleToggleFavorite = (song: any) => {
    const songData = {
      id: song.songId,
      title: song.songTitle,
      artist: song.artistName,
      album: song.albumName,
      duration: song.duration,
      preview: song.preview,
      cover: song.cover,
      artistPicture: song.cover,
      link: ''
    };

    if (isFavorite(song.songId)) {
      removeFromFavorites(song.songId);
    } else {
      addToFavorites(song.songId);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!currentPlaylist) return;
    
    try {
      await removeSongFromPlaylist(currentPlaylist._id, songId);
      toast({
        title: "Success",
        description: "Song removed from playlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove song",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!currentPlaylist) return;
    
    if (!confirm(`Are you sure you want to delete "${currentPlaylist.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deletePlaylist(currentPlaylist._id);
      setSelectedPlaylistId(null);
      toast({
        title: "Success",
        description: `Playlist "${currentPlaylist.name}" deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete playlist",
        variant: "destructive"
      });
    }
  };

  if (error === 'Authentication required') {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign in required</h2>
          <p className="text-gray-400 mb-6">Please sign in to access your playlists</p>
          <button
            onClick={() => navigate('/signin')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Your Library</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-white text-black px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform"
        >
          <Plus size={20} />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Create Playlist Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold mb-3">Create New Playlist</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <button
              onClick={handleCreatePlaylist}
              disabled={isCreating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewPlaylistName('');
              }}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Playlists List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Your Playlists</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading playlists...</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No playlists yet</p>
              <p className="text-gray-500 text-sm">Create your first playlist to get started</p>
            </div>
          ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
                <div 
                  key={playlist._id} 
                  className={`flex items-center p-3 rounded-lg cursor-pointer group transition-all ${
                    selectedPlaylistId === playlist._id 
                      ? 'bg-purple-600/20 border border-purple-500/30' 
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                  onClick={() => handlePlaylistSelect(playlist._id)}
                >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-4 flex items-center justify-center">
                  <Music size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {playlist.songCount} song{playlist.songCount !== 1 ? 's' : ''}
                      {playlist.totalDuration > 0 && ` • ${formatTotalDuration(playlist.totalDuration)}`}
                    </p>
                </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center transition-all hover:scale-105 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaylistSelect(playlist._id);
                      setTimeout(() => handlePlayAllSongs(), 100);
                    }}
                  >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Playlist Detail */}
        <div className="lg:col-span-2">
          {currentPlaylist ? (
            <>
              {/* Playlist Header */}
          <div className="bg-gradient-to-b from-purple-600/30 to-transparent p-8 rounded-lg mb-6">
            <div className="flex items-end space-x-6">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl flex items-center justify-center">
                <Music size={64} />
              </div>
                  <div className="flex-1">
                <p className="text-sm font-medium mb-2 text-gray-300">PLAYLIST</p>
                    <h1 className="text-5xl font-bold mb-4">{currentPlaylist.name}</h1>
                <div className="flex items-center text-gray-300 text-sm space-x-1">
                  <span>Made by You</span>
                  <span>•</span>
                      <span>{currentPlaylist.songCount} song{currentPlaylist.songCount !== 1 ? 's' : ''}</span>
                      {currentPlaylist.totalDuration > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatTotalDuration(currentPlaylist.totalDuration)}</span>
                        </>
                      )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 mt-8">
                  <button 
                    onClick={handlePlayAllSongs}
                    disabled={currentPlaylistSongs.length === 0}
                    className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                <Play size={24} fill="currentColor" />
              </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowPlaylistMenu(showPlaylistMenu === currentPlaylist._id ? null : currentPlaylist._id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                <MoreHorizontal size={32} />
              </button>
                    {showPlaylistMenu === currentPlaylist._id && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                        <button
                          onClick={handleDeletePlaylist}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span>Delete Playlist</span>
                        </button>
                      </div>
                    )}
                  </div>
            </div>
          </div>

          {/* Songs List */}
              {currentPlaylistSongs.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No songs yet</h3>
                  <p className="text-gray-400">Add songs to your playlist to get started</p>
                </div>
              ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-gray-400 text-sm border-b border-white/10">
              <div className="col-span-1">#</div>
              <div className="col-span-5">TITLE</div>
              <div className="col-span-3">ALBUM</div>
              <div className="col-span-2">DATE ADDED</div>
              <div className="col-span-1 text-right">⏱</div>
            </div>
            
                  {currentPlaylistSongs.map((song, index) => (
                    <div 
                      key={song._id} 
                      className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-white/5 group cursor-pointer"
                      onClick={() => handlePlaySong(song)}
                    >
                <div className="col-span-1 flex items-center">
                  <span className="text-gray-400 group-hover:hidden">{index + 1}</span>
                  <button className="hidden group-hover:block text-white">
                    <Play size={16} />
                  </button>
                </div>
                <div className="col-span-5 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded overflow-hidden">
                          <img 
                            src={song.cover} 
                            alt={song.albumName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                  <div>
                          <p className="font-medium text-white">{song.songTitle}</p>
                          <p className="text-gray-400 text-sm">{song.artistName}</p>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center text-gray-400 text-sm">{song.albumName}</div>
                      <div className="col-span-2 flex items-center text-gray-400 text-sm">
                        {new Date(song.addedAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-1 flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(song);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-all ${
                            isFavorite(song.songId) 
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart 
                            size={16} 
                            fill={isFavorite(song.songId) ? 'currentColor' : 'none'} 
                          />
                        </button>
                        <div className="text-gray-400 text-sm w-12 text-right">
                          {formatDuration(song.duration)}
                        </div>
                                                 <div className="relative">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleRemoveSong(song.songId);
                             }}
                             className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                             title="Remove from playlist"
                           >
                             <X size={16} />
                           </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Playlist</h3>
              <p className="text-gray-400">Choose a playlist from the left to view its songs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Playlists;
