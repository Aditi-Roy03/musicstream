
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

const MusicPlayer: React.FC = () => {
  const location = useLocation();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    currentIndex,
    playError,
    playPause,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    clearPlayError,
  } = useMusicPlayer();

  // Don't show music player on auth pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  if (isAuthPage) {
    return null;
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 z-50">
      {/* Error Message */}
      {playError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm text-center">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <span>{playError}</span>
            <button 
              onClick={clearPlayError}
              className="text-white hover:text-gray-200 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-4 w-1/4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 overflow-hidden">
            {currentSong.cover && (
              <img
                src={currentSong.cover}
                alt={currentSong.album}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{currentSong.title}</p>
            <p className="text-gray-400 text-sm truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center w-1/2">
          <div className="flex items-center space-x-6 mb-2">
            <button 
              onClick={previousSong}
              className={`transition-colors ${
                queue.length === 0 || currentIndex <= 0 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-white'
              }`}
              disabled={queue.length === 0 || currentIndex <= 0}
            >
              <SkipBack size={24} />
            </button>
            <button
              onClick={playPause}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button 
              onClick={nextSong}
              className={`transition-colors ${
                queue.length === 0 || currentIndex >= queue.length - 1 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-white'
              }`}
              disabled={queue.length === 0 || currentIndex >= queue.length - 1}
            >
              <SkipForward size={24} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={(value) => seekTo(value[0])}
                className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&>span:first-child]:bg-gray-600 [&>span:first-child>span]:bg-white"
              />
            </div>
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <Volume2 size={20} className="text-gray-400" />
          <div className="w-24">
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&>span:first-child]:bg-gray-600 [&>span:first-child>span]:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
