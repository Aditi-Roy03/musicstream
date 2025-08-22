
import React, { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, UserCheck } from 'lucide-react';
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

const Artists = () => {
  const [followingArtists, setFollowingArtists] = useState<Artist[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [showAllFollowing, setShowAllFollowing] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      
      // Fetch artists you follow
      const followingResponse = await fetch('http://localhost:3001/api/artists/following', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowingArtists(followingData.artists);
      }

      // Fetch popular artists
      const popularResponse = await fetch('http://localhost:3001/api/artists/popular?limit=8', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        setPopularArtists(popularData.artists);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch artists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPopularArtists = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/artists/popular?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPopularArtists(data.artists);
      }
    } catch (error) {
      console.error('Error fetching all popular artists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch all popular artists",
        variant: "destructive"
      });
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
        // Update the artist's following status
        setPopularArtists(prev => 
          prev.map(artist => 
            artist.id === artistId 
              ? { ...artist, isFollowing: true }
              : artist
          )
        );
        
        // Add to following artists if not already there
        const artistToAdd = popularArtists.find(artist => artist.id === artistId);
        if (artistToAdd) {
          setFollowingArtists(prev => [artistToAdd, ...prev]);
        }

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
        // Update the artist's following status
        setPopularArtists(prev => 
          prev.map(artist => 
            artist.id === artistId 
              ? { ...artist, isFollowing: false }
              : artist
          )
        );
        
        // Remove from following artists
        setFollowingArtists(prev => prev.filter(artist => artist.id !== artistId));

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

  const displayedFollowingArtists = showAllFollowing ? followingArtists : followingArtists.slice(0, 6);
  const displayedPopularArtists = popularArtists; // Show all fetched artists

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Artists</h1>
          <p className="text-gray-400">Discover and follow your favorite artists</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading artists...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Artists</h1>
        <p className="text-gray-400">Discover and follow your favorite artists</p>
      </div>

      {/* Following Artists */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Artists you follow</h2>
          {followingArtists.length > 6 && (
            <button 
              onClick={() => setShowAllFollowing(!showAllFollowing)}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              {showAllFollowing ? 'Show less' : 'Show all'}
            </button>
          )}
        </div>
        
        {followingArtists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {displayedFollowingArtists.map((artist) => (
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
                <p className="text-gray-400 text-sm">{artist.genre}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">You're not following any artists yet</p>
            <p className="text-gray-500 text-sm">Start following artists from the popular artists section below</p>
          </div>
        )}
      </section>

      {/* Popular Artists */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Popular artists</h2>
          <button 
            onClick={() => {
              if (showAllPopular) {
                setShowAllPopular(false);
                fetchArtists(); // Reset to original 8 artists
              } else {
                setShowAllPopular(true);
                fetchAllPopularArtists(); // Fetch more artists
              }
            }}
            className="text-gray-400 hover:text-white text-sm font-medium"
          >
            {showAllPopular ? 'Show less' : 'Show all'}
          </button>
        </div>
        
        <div className="space-y-2">
          {displayedPopularArtists.map((artist, index) => (
            <div key={artist.id} className="flex items-center p-4 rounded-lg hover:bg-white/5 group cursor-pointer transition-all">
              <div className="w-8 text-gray-400 text-sm mr-4">{index + 1}</div>
              <img 
                src={artist.picture} 
                alt={artist.name}
                className="w-16 h-16 rounded-full mr-4 relative group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg">{artist.name}</h3>
                <p className="text-gray-400 text-sm">{artist.genre} • {formatFollowers(artist.followers)} monthly listeners</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (artist.isFollowing) {
                      handleUnfollowArtist(artist.id, artist.name);
                    } else {
                      handleFollowArtist(artist.id, artist.name);
                    }
                  }}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    artist.isFollowing
                      ? 'bg-green-500 text-white hover:bg-green-400'
                      : 'border border-gray-400 text-gray-400 hover:border-white hover:text-white'
                  }`}
                >
                  {artist.isFollowing ? (
                    <span className="flex items-center space-x-2">
                      <UserCheck size={16} />
                      <span>Following</span>
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Artists;
