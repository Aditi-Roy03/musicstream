
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Music, Heart, Clock, Users, List } from 'lucide-react';
import ProfileButton from './ProfileButton';
import { usePlaylists } from '../contexts/PlaylistContext';
import { useToast } from '../hooks/use-toast';

const Sidebar = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createPlaylist } = usePlaylists();
  const { toast } = useToast();

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

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/playlists', icon: List, label: 'Playlists' },
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/recent', icon: Clock, label: 'Recent' },
    { to: '/artists', icon: Users, label: 'Artists' },
  ];

  return (
    <div className="w-64 bg-black/30 backdrop-blur-sm h-screen p-6 border-r border-white/10 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
          MusicStream
        </h1>
      </div>
      
      <nav className="space-y-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 mb-4 p-4 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-lg border border-red-500/30">
        <h3 className="text-sm font-semibold mb-2">Create Playlist</h3>
        <p className="text-xs text-gray-400 mb-3">
          It's easy, we'll help you
        </p>
        
        {!showCreateForm ? (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-white text-black py-2 px-4 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Create Playlist
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreatePlaylist}
                disabled={isCreating}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                }}
                className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Button at the bottom */}
      <div className="mt-auto">
        <ProfileButton />
      </div>
    </div>
  );
};

export default Sidebar;
