import React from 'react';
import { Play, Heart, MoreHorizontal, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayHistory } from '../contexts/PlayHistoryContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';

const PlayHistory = () => {
  const navigate = useNavigate();
  const { playHistory, isLoading } = usePlayHistory();
  const { playSong, setCurrentSongList } = useMusicPlayer();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = (song: any) => {
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
    
    // Convert play history to song format for queue
    const songList = playHistory.map((historySong: any) => ({
      id: historySong.songId,
      title: historySong.songTitle,
      artist: historySong.artistName,
      album: historySong.albumName,
      duration: historySong.duration,
      preview: historySong.preview,
      cover: historySong.cover,
      artistPicture: historySong.cover,
      link: ''
    }));
    
    setCurrentSongList(songList, song.songId);
    playSong(songData);
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

    if (isFavorite(songData)) {
      removeFromFavorites(songData);
    } else {
      addToFavorites(songData);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
            <h1 className="text-3xl font-bold">Play History</h1>
            <p className="text-gray-400">Your recently played songs</p>
          </div>
        </div>
      </div>

      {/* Play History List */}
      {isLoading ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading play history...</p>
        </div>
      ) : playHistory.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">No play history yet</h3>
          <p className="text-gray-400 mb-4">Start listening to music to see your history here</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-full font-medium transition-colors"
          >
            Discover Music
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {playHistory.map((song, index) => (
            <div 
              key={song._id} 
              className="flex items-center p-4 rounded-lg hover:bg-white/5 group cursor-pointer transition-all duration-200"
            >
              <div className="w-12 text-gray-400 text-sm mr-4">{index + 1}</div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded mr-4 overflow-hidden">
                <img 
                  src={song.cover} 
                  alt={song.albumName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.songTitle}</p>
                <p className="text-gray-400 text-sm truncate">{song.artistName}</p>
              </div>
              <div className="hidden md:block text-gray-400 text-sm mr-8">{song.albumName}</div>
              <div className="flex items-center space-x-3">
                                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(song);
                    }}
                    className={`p-2 rounded-full transition-all ${
                      isFavorite(song.songId) 
                        ? 'text-red-500 bg-red-500/10' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <Heart 
                      size={18} 
                      fill={isFavorite(song.songId) ? 'currentColor' : 'none'} 
                    />
                  </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySong(song);
                  }}
                  className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-black transition-colors"
                >
                  <Play size={16} fill="currentColor" />
                </button>
                <div className="text-gray-400 text-sm w-16 text-right">{formatDuration(song.duration)}</div>
                <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-2 rounded-full hover:bg-white/10">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayHistory; 