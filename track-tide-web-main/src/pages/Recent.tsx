
import React, { useState } from 'react';
import { Clock, Play, MoreHorizontal, Heart, Plus } from 'lucide-react';
import { usePlayHistory } from '../contexts/PlayHistoryContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import AddToPlaylistDialog from '../components/AddToPlaylistDialog';

const Recent = () => {
  const { playHistory, isLoading } = usePlayHistory();
  const { playSong, setCurrentSongList, currentSong } = useMusicPlayer();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPlayedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const handlePlaySong = (song: any) => {
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
    
    setTimeout(() => setPlayingSongId(null), 1000);
  };

  const handlePlayAllSongs = () => {
    if (playHistory.length === 0) return;
    
    const firstSong = playHistory[0];
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

  const handleAddToPlaylist = (song: any) => {
    setSelectedSong(song);
    setShowAddToPlaylist(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/30 to-transparent p-8 rounded-lg mb-6">
        <div className="flex items-end space-x-6">
          <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-2xl flex items-center justify-center">
            <Clock size={64} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-gray-300">YOUR ACTIVITY</p>
            <h1 className="text-5xl font-bold mb-4">Recently Played</h1>
            <div className="flex items-center text-gray-300 text-sm space-x-1">
              <span>Your listening history</span>
              <span>•</span>
              <span>{playHistory.length} tracks</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 mt-8">
          <button 
            onClick={handlePlayAllSongs}
            disabled={playHistory.length === 0}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={24} fill="currentColor" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal size={32} />
          </button>
        </div>
      </div>

      {/* Recently Played List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading play history...</p>
        </div>
      ) : playHistory.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No recently played songs</h3>
          <p className="text-gray-400">Start listening to music to see your history here</p>
        </div>
      ) : (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-gray-400 text-sm border-b border-white/10">
          <div className="col-span-1">#</div>
          <div className="col-span-5">TITLE</div>
          <div className="col-span-3">ALBUM</div>
          <div className="col-span-2">PLAYED AT</div>
          <div className="col-span-1 text-right">⏱</div>
        </div>
        
          {playHistory.map((song, index) => (
            <div 
              key={song._id} 
              className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-white/5 group cursor-pointer transition-all duration-200"
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
                {formatPlayedAt(song.playedAt)}
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
                <div className="text-gray-400 text-sm w-12 text-right">
                  {formatDuration(song.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Statistics */}
      {playHistory.length > 0 && (
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">This Week</h3>
            <p className="text-3xl font-bold text-green-400 mb-1">
              {Math.floor(playHistory.reduce((total, song) => total + song.duration, 0) / 60)}m
            </p>
          <p className="text-gray-400 text-sm">Total listening time</p>
        </div>
        <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Unique Artists</h3>
            <p className="text-3xl font-bold text-purple-400 mb-1">
              {new Set(playHistory.map(song => song.artistName)).size}
            </p>
            <p className="text-gray-400 text-sm">Different artists played</p>
        </div>
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Songs Played</h3>
            <p className="text-3xl font-bold text-blue-400 mb-1">{playHistory.length}</p>
            <p className="text-gray-400 text-sm">Tracks in history</p>
      </div>
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

export default Recent;
