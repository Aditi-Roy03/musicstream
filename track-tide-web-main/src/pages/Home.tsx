
import React from 'react';
import { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, Clock, Plus, UserCheck, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayHistory } from '../contexts/PlayHistoryContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import AddToPlaylistDialog from '../components/AddToPlaylistDialog';
import { useToast } from '../hooks/use-toast';

interface Artist {
  id: number;
  name: string;
  picture: string;
  picture_big: string;
  followers?: number;
  genre: string;
  isFollowing: boolean;
  followedAt?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { playHistory, isLoading } = usePlayHistory();
  const { playSong, setCurrentSongList, currentSong } = useMusicPlayer();
  const { addToFavorites, removeFromFavorites, isFavorite, favorites } = useFavorites();
  const { playlists, fetchPlaylists } = usePlaylists();
  const { toast } = useToast();
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPopularArtists();
    fetchPlaylists();
  }, [fetchPlaylists]);

  const fetchPopularArtists = async () => {
    try {
      setArtistsLoading(true);
      const response = await fetch('http://localhost:3001/api/artists/popular?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPopularArtists(data.artists);
      }
    } catch (error) {
      console.error('Error fetching popular artists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch popular artists",
        variant: "destructive"
      });
    } finally {
      setArtistsLoading(false);
    }
  };

  const handleFollowArtist = async (artistId: number, artistName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/artists/${artistId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPopularArtists(prev => 
          prev.map(artist => 
            artist.id === artistId 
              ? { ...artist, isFollowing: true }
              : artist
          )
        );

        toast({
          title: "Success",
          description: `Started following ${artistName}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to follow artist",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error following artist:', error);
      toast({
        title: "Error",
        description: "Failed to follow artist",
        variant: "destructive"
      });
    }
  };

  const handleUnfollowArtist = async (artistId: number, artistName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/artists/${artistId}/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPopularArtists(prev => 
          prev.map(artist => 
            artist.id === artistId 
              ? { ...artist, isFollowing: false }
              : artist
          )
        );

        toast({
          title: "Success",
          description: `Unfollowed ${artistName}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to unfollow artist",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error unfollowing artist:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow artist",
        variant: "destructive"
      });
    }
  };

  const formatFollowers = (followers: number | undefined) => {
    if (!followers || followers === 0) {
      return '0';
    }
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  const handlePlaySong = (song: any) => {
    console.log('Playing song from home page:', song);
    
    // Ensure all required properties exist
    if (!song.preview) {
      console.error('Song preview URL is missing:', song);
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
    
    // Convert play history to song format for queue
    const songList = playHistory.map((historySong: any) => ({
      id: parseInt(historySong.songId),
      title: historySong.songTitle,
      artist: historySong.artistName,
      album: historySong.albumName,
      duration: historySong.duration,
      preview: historySong.preview,
      cover: historySong.cover,
      artistPicture: historySong.cover,
      link: ''
    }));
    
    setCurrentSongList(songList, parseInt(song.songId));
    playSong(songData);
    
    // Clear playing indicator after a short delay
    setTimeout(() => setPlayingSongId(null), 1000);
  };

  const handlePlayAllFavorites = () => {
    if (favorites.length === 0) return;
    
    console.log('Playing all favorites from home page');
    
    // Convert favorites to song format for queue
    const songList = favorites.map((favSong: any) => ({
      id: parseInt(favSong.songId),
      title: favSong.songTitle,
      artist: favSong.artistName,
      album: favSong.albumName,
      duration: favSong.duration,
      preview: favSong.preview,
      cover: favSong.cover,
      artistPicture: favSong.cover,
      link: ''
    }));
    
    console.log('Favorites song list:', songList);
    console.log('First song ID:', parseInt(favorites[0].songId));
    
    // Set the queue and play the first song
    setCurrentSongList(songList, parseInt(favorites[0].songId));
    
    const firstSong = {
      id: parseInt(favorites[0].songId),
      title: favorites[0].songTitle,
      artist: favorites[0].artistName,
      album: favorites[0].albumName,
      duration: favorites[0].duration,
      preview: favorites[0].preview,
      cover: favorites[0].cover,
      artistPicture: favorites[0].cover,
      link: ''
    };
    
    playSong(firstSong);
  };

  const handlePlayAllRecentlyPlayed = () => {
    if (playHistory.length === 0) return;
    
    console.log('Playing all recently played from home page');
    
    // Convert play history to song format for queue
    const songList = playHistory.map((historySong: any) => ({
      id: parseInt(historySong.songId),
      title: historySong.songTitle,
      artist: historySong.artistName,
      album: historySong.albumName,
      duration: historySong.duration,
      preview: historySong.preview,
      cover: historySong.cover,
      artistPicture: historySong.cover,
      link: ''
    }));
    
    console.log('Recently played song list:', songList);
    console.log('First song ID:', parseInt(playHistory[0].songId));
    
    // Set the queue and play the first song
    setCurrentSongList(songList, parseInt(playHistory[0].songId));
    
    const firstSong = {
      id: parseInt(playHistory[0].songId),
      title: playHistory[0].songTitle,
      artist: playHistory[0].artistName,
      album: playHistory[0].albumName,
      duration: playHistory[0].duration,
      preview: playHistory[0].preview,
      cover: playHistory[0].cover,
      artistPicture: playHistory[0].cover,
      link: ''
    };
    
    playSong(firstSong);
  };

  const handleQuickAccessClick = (action: string, playlist?: any) => {
    console.log('Quick access clicked:', action);
    
    switch (action) {
      case 'playAllFavorites':
        if (favorites.length > 0) {
          handlePlayAllFavorites();
        } else {
          navigate('/favorites');
        }
        break;
      case 'playAllRecentlyPlayed':
        if (playHistory.length > 0) {
          handlePlayAllRecentlyPlayed();
        } else {
          navigate('/search');
        }
        break;
      case 'playFirstPlaylist':
        if (playlist) {
          handlePlayPlaylist(playlist);
        }
        break;
      case 'navigateToPlaylists':
        navigate('/playlists');
        break;
      case 'navigateToSearch':
        navigate('/search');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handlePlayFavoriteSong = (song: any) => {
    console.log('Playing favorite song from home page:', song);
    
    // Ensure all required properties exist
    if (!song.preview) {
      console.error('Song preview URL is missing:', song);
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
    
    // Convert favorites to song format for queue
    const songList = favorites.map((favSong: any) => ({
      id: parseInt(favSong.songId),
      title: favSong.songTitle,
      artist: favSong.artistName,
      album: favSong.albumName,
      duration: favSong.duration,
      preview: favSong.preview,
      cover: favSong.cover,
      artistPicture: favSong.cover,
      link: ''
    }));
    
    setCurrentSongList(songList, parseInt(song.songId));
    playSong(songData);
    
    // Clear playing indicator after a short delay
    setTimeout(() => setPlayingSongId(null), 1000);
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

  const handleAddToPlaylist = (song: any) => {
    setSelectedSong(song);
    setShowAddToPlaylist(true);
  };

  const handlePlayPlaylist = (playlist: any) => {
    if (!playlist.songs || playlist.songs.length === 0) {
      toast({
        title: "Empty Playlist",
        description: "This playlist has no songs to play",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Playing playlist from home page:', playlist.name);
    
    // Convert playlist songs to song format for queue
    const songList = playlist.songs.map((playlistSong: any) => ({
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
    
    console.log('Playlist song list:', songList);
    console.log('First song ID:', parseInt(playlist.songs[0].songId));
    
    // Set the queue and play the first song
    setCurrentSongList(songList, parseInt(playlist.songs[0].songId));
    
    const firstSong = {
      id: parseInt(playlist.songs[0].songId),
      title: playlist.songs[0].songTitle,
      artist: playlist.songs[0].artistName,
      album: playlist.songs[0].albumName,
      duration: playlist.songs[0].duration,
      preview: playlist.songs[0].preview,
      cover: playlist.songs[0].cover,
      artistPicture: playlist.songs[0].cover,
      link: ''
    };
    
    playSong(firstSong);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPlaylistDuration = (seconds: number) => {
    if (seconds === 0) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Good evening</h1>
        <p className="text-gray-400">Welcome back to your music</p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {[
          { name: 'Liked Songs', action: 'playAllFavorites', color: 'from-red-500 to-pink-500', icon: '❤️' },
          { name: 'Recently Played', action: 'playAllRecentlyPlayed', color: 'from-blue-500 to-purple-500', icon: '🕒' },
          ...(playlists.length > 0 ? [
            { 
              name: playlists[0].name, 
              action: 'playFirstPlaylist', 
              color: 'from-green-500 to-teal-500', 
              icon: '📜',
              playlist: playlists[0]
            }
          ] : [
            { name: 'Create Playlist', action: 'navigateToPlaylists', color: 'from-green-500 to-teal-500', icon: '📜' }
          ]),
          { name: 'Discover Weekly', action: 'navigateToSearch', color: 'from-yellow-500 to-orange-500', icon: '🔍' },
          { name: 'Release Radar', action: 'navigateToSearch', color: 'from-indigo-500 to-purple-500', icon: '📡' },
          { name: 'Daily Mix 1', action: 'navigateToSearch', color: 'from-pink-500 to-rose-500', icon: '🎵' }
        ].map((item, index) => (
          <div 
            key={index} 
            className="flex items-center bg-white/5 hover:bg-white/10 rounded-lg p-3 group cursor-pointer transition-all duration-300"
            onClick={() => handleQuickAccessClick(item.action, item.playlist)}
            title={`Click to ${item.action === 'playAllFavorites' ? 'play all liked songs' : 
                   item.action === 'playAllRecentlyPlayed' ? 'play all recently played' : 
                   'navigate to ' + item.name.toLowerCase()}`}
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded mr-4 flex-shrink-0`}>
            </div>
            <span className="font-medium flex-1">{item.name}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAccessClick(item.action, item.playlist);
                }}
              >
                <Play size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Liked Songs */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Liked Songs</h2>
          <div className="flex items-center gap-4">
            {favorites.length > 0 && (
              <button 
                onClick={() => handlePlayAllFavorites()}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-full font-medium transition-colors"
              >
                <Play size={16} fill="currentColor" />
                Play All
              </button>
            )}
            <button 
              onClick={() => navigate('/favorites')}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              Show all
            </button>
          </div>
        </div>
        
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No liked songs yet</p>
            <p className="text-gray-500 text-sm">Start liking songs to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.slice(0, 8).map((song, index) => (
              <div 
                key={song._id} 
                className="flex items-center p-3 rounded-lg hover:bg-white/5 group cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePlayFavoriteSong(song);
                }}
                title="Click to play"
              >
                <div className="w-8 text-gray-400 text-sm mr-4">{index + 1}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded mr-4 overflow-hidden relative">
                  <img 
                    src={song.cover} 
                    alt={song.albumName}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 flex items-center justify-center ${
                    currentSong?.id.toString() === song.songId || playingSongId === song.songId 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <Play size={16} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.songTitle}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artistName}</p>
                </div>
                <div className="hidden md:block text-gray-400 text-sm mr-8">{song.albumName}</div>
                                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(song);
                      }}
                      className="text-red-500 opacity-100 group-hover:opacity-100 transition-all"
                    >
                      <Heart 
                        size={16} 
                        fill="currentColor" 
                      />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(song);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                      title="Add to playlist"
                    >
                      <Plus size={16} />
                    </button>
                    <div className="text-gray-400 text-sm w-12 text-right">{formatDuration(song.duration)}</div>
                    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Playlists */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Playlists</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/playlists')}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              Show all
            </button>
          </div>
        </div>
        
        {playlists.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No playlists yet</p>
            <p className="text-gray-500 text-sm">Create your first playlist to get started</p>
            <button 
              onClick={() => navigate('/playlists')}
              className="mt-4 bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-full font-medium transition-colors"
            >
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.slice(0, 8).map((playlist) => (
              <div 
                key={playlist._id} 
                className="bg-white/5 hover:bg-white/10 rounded-lg p-4 group cursor-pointer transition-all duration-300"
                onClick={() => navigate(`/playlists/${playlist._id}`)}
                title="Click to view playlist"
              >
                <div className="relative mb-4">
                  <div className="w-full aspect-square bg-gradient-to-br from-green-500 to-blue-500 rounded-lg overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                    {playlist.songs && playlist.songs.length > 0 ? (
                      <img 
                        src={playlist.songs[0].cover} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={48} className="text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPlaylist(playlist);
                        }}
                        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        title="Play playlist"
                      >
                        <Play size={20} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-lg group-hover:text-white transition-colors truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {playlist.songCount || 0} songs • {formatPlaylistDuration(playlist.totalDuration || 0)}
                  </p>
                  {playlist.description && (
                    <p className="text-gray-500 text-sm truncate">
                      {playlist.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Played */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recently played</h2>
          <div className="flex items-center gap-4">
            {playHistory.length > 0 && (
              <button 
                onClick={() => handlePlayAllRecentlyPlayed()}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-full font-medium transition-colors"
              >
                <Play size={16} fill="currentColor" />
                Play All
              </button>
            )}
            <button 
              onClick={() => navigate('/play-history')}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              Show all
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading play history...</p>
          </div>
        ) : playHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No recently played songs</p>
            <p className="text-gray-500 text-sm">Start listening to music to see your history here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playHistory.slice(0, 8).map((song, index) => (
              <div 
                key={song._id} 
                className="flex items-center p-3 rounded-lg hover:bg-white/5 group cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePlaySong(song);
                }}
                title="Click to play"
              >
                <div className="w-8 text-gray-400 text-sm mr-4">{index + 1}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded mr-4 overflow-hidden relative">
                  <img 
                    src={song.cover} 
                    alt={song.albumName}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 flex items-center justify-center ${
                    currentSong?.id.toString() === song.songId || playingSongId === song.songId 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <Play size={16} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.songTitle}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artistName}</p>
                </div>
                <div className="hidden md:block text-gray-400 text-sm mr-8">{song.albumName}</div>
                <div className="flex items-center space-x-2">
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
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(song);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                    title="Add to playlist"
                  >
                    <Plus size={16} />
                  </button>
                  <div className="text-gray-400 text-sm w-12 text-right">{formatDuration(song.duration)}</div>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular Artists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Popular artists</h2>
          <button 
            onClick={() => navigate('/artists')}
            className="text-gray-400 hover:text-white text-sm font-medium"
          >
            Show all
          </button>
        </div>
        
        {artistsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading popular artists...</div>
          </div>
        ) : popularArtists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No popular artists available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {popularArtists.map((artist) => (
              <div key={artist.id} className="text-center group cursor-pointer">
                <div className="relative">
                  <img 
                    src={artist.picture} 
                    alt={artist.name}
                    className="w-full aspect-square rounded-full mb-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
                <h3 className="font-medium mb-1 group-hover:text-white transition-colors">{artist.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{formatFollowers(artist.followers)} followers</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (artist.isFollowing) {
                      handleUnfollowArtist(artist.id, artist.name);
                    } else {
                      handleFollowArtist(artist.id, artist.name);
                    }
                  }}
                  className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                    artist.isFollowing
                      ? 'bg-green-500 text-white hover:bg-green-400'
                      : 'border border-gray-400 text-gray-400 hover:border-white hover:text-white'
                  }`}
                >
                  {artist.isFollowing ? (
                    <span className="flex items-center space-x-1">
                      <UserCheck size={12} />
                      <span>Following</span>
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

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

export default Home;
