import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

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

interface MusicPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  currentIndex: number;
  playError: string | null;
  playSong: (song: Song) => void;
  playPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  stopMusic: () => void;
  setCurrentSongList: (songs: Song[], currentSongId?: number) => void;
  clearPlayError: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playError, setPlayError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    const audio = audioRef.current;
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
      nextSong();
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      setPlayError('Failed to load audio. The preview may not be available.');
      
      // Try to play the next song if available
      setTimeout(() => {
        if (queue.length > 0 && currentIndex < queue.length - 1) {
          console.log('Attempting to play next song due to error');
          nextSong();
        }
      }, 2000); // Wait 2 seconds before trying next song
    });

    // Check for logout and stop music
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentSong(null);
        setCurrentTime(0);
        setDuration(0);
      }
    };

    // Listen for storage changes (logout)
    window.addEventListener('storage', checkAuth);
    
    // Check on mount
    checkAuth();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = (song: Song) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setCurrentSong(song);
    setCurrentTime(0);
    setPlayError(null); // Clear any previous errors
    
    if (audioRef.current) {
      audioRef.current.src = song.preview;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlayError(null);
        // Save to play history
        saveToPlayHistory(song);
      }).catch((error) => {
        console.error('Failed to play song:', error);
        setIsPlaying(false);
        
        // Provide more specific error messages
        if (error.name === 'NotSupportedError') {
          setPlayError('Audio preview not available for this song.');
        } else if (error.name === 'NotAllowedError') {
          setPlayError('Audio playback was blocked. Please try again.');
        } else {
          setPlayError('Failed to play song. Please try again.');
        }
      });
    }
  };

  const saveToPlayHistory = async (song: Song) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('http://localhost:3001/api/history', {
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
          preview: song.preview
        })
      });
    } catch (error) {
      console.error('Failed to save to play history:', error);
    }
  };

  const playPause = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Failed to play:', error);
      });
    }
  };

  const nextSong = () => {
    console.log('Next song called:', { queueLength: queue.length, currentIndex, hasCurrentSong: !!currentSong });
    
    // If we have a queue, use it
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log('Playing next song from queue:', nextIndex);
      setCurrentIndex(nextIndex);
      playSong(queue[nextIndex]);
      return;
    }
    
    // If no queue, try to get next song from current context
    // This could be from search results, favorites, or play history
    // For now, we'll just restart the current song
    if (currentSong) {
      console.log('Restarting current song');
      playSong(currentSong);
    }
  };

  const previousSong = () => {
    console.log('Previous song called:', { queueLength: queue.length, currentIndex, hasCurrentSong: !!currentSong });
    
    // If we have a queue, use it
    if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      console.log('Playing previous song from queue:', prevIndex);
      setCurrentIndex(prevIndex);
      playSong(queue[prevIndex]);
      return;
    }
    
    // If no queue, try to get previous song from current context
    // This could be from search results, favorites, or play history
    // For now, we'll just restart the current song
    if (currentSong) {
      console.log('Restarting current song');
      playSong(currentSong);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);
    setDuration(0);
    setPlayError(null);
  };

  const clearPlayError = () => {
    setPlayError(null);
  };

  const setCurrentSongList = (songs: Song[], currentSongId?: number) => {
    console.log('Setting current song list:', { songs: songs.length, currentSongId });
    setQueue(songs);
    if (currentSongId) {
      const index = songs.findIndex(song => song.id === currentSongId);
      console.log('Found song at index:', index, 'for songId:', currentSongId);
      setCurrentIndex(index >= 0 ? index : -1);
    } else {
      setCurrentIndex(-1);
    }
  };

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    currentIndex,
    playError,
    playSong,
    playPause,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    addToQueue,
    removeFromQueue,
    clearQueue,
    stopMusic,
    setCurrentSongList,
    clearPlayError,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}; 