
import React from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { Play, Heart, Clock } from 'lucide-react';

const Favorites: React.FC = () => {
  const { favorites, isLoading, removeFromFavorites } = useFavorites();
  const { playSong, setCurrentSongList } = useMusicPlayer();

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
    
    // Convert favorites to song format for queue
    const songList = favorites.map((favSong: any) => ({
      id: favSong.songId,
      title: favSong.songTitle,
      artist: favSong.artistName,
      album: favSong.albumName,
      duration: favSong.duration,
      preview: favSong.preview,
      cover: favSong.cover,
      artistPicture: favSong.cover,
      link: ''
    }));
    
    setCurrentSongList(songList, song.songId);
    playSong(songData);
  };

  const handleRemoveFavorite = async (songId: string) => {
    await removeFromFavorites(songId);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-12 w-12 text-gray-400 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Loading favorites...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your Favorites</h1>
        <p className="text-gray-400">
          {favorites.length === 0 
            ? "You haven't liked any songs yet" 
            : `${favorites.length} favorite song${favorites.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No favorites yet</h3>
          <p className="text-gray-400 text-lg">Start exploring music and like your favorite songs!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((song) => (
              <div 
                key={song._id} 
                className="group relative bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <div className="relative">
                  <img
                    src={song.cover}
                    alt={song.albumName}
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
                  <div className="absolute top-3 right-3">
                    <button 
                      className="w-8 h-8 bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(song.songId);
                      }}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-white truncate mb-1">
                    {song.songTitle}
                  </h3>
                  <p className="text-gray-400 text-sm truncate mb-1">
                    {song.artistName}
                  </p>
                  <p className="text-gray-400 text-xs truncate mb-3">
                    {song.albumName}
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
    </div>
  );
};

export default Favorites;
