import React, { useState, useEffect } from "react";

import { Plus, Check, X } from "lucide-react";
import { usePlaylists } from "../contexts/PlaylistContext";
import { useToast } from "../hooks/use-toast";

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any;
}

const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  isOpen,
  onClose,
  song,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const {
    playlists,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    fetchPlaylists,
  } = usePlaylists();
  const { toast } = useToast();

  // Auto-check playlists that already contain this song
  useEffect(() => {
    if (song && playlists.length > 0) {
      const songId = song.id || song.songId;
      console.log('Checking for song:', songId, 'in playlists:', playlists);
      
      const playlistsWithSong = playlists.filter((playlist) => {
        const hasSong = playlist.songs?.some((s: any) => s.songId === songId);
        console.log(`Playlist "${playlist.name}" has song:`, hasSong, 'songs:', playlist.songs);
        return hasSong;
      });
      
      console.log('Playlists with song:', playlistsWithSong);
      setSelectedPlaylists(playlistsWithSong.map((p) => p._id));
    }
  }, [song, playlists]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlaylistToggle = (playlistId: string) => {
    setSelectedPlaylists((prev) =>
      prev.includes(playlistId)
        ? prev.filter((id) => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      setSelectedPlaylists((prev) => [...prev, newPlaylist._id]);
      setNewPlaylistName("");
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: `Playlist "${newPlaylist.name}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create playlist",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylists = async () => {
    try {
      setIsAdding(true);

      const songId = song.id || song.songId;
      
      // Get all playlists that currently have this song
      const currentPlaylistsWithSong = playlists
        .filter((playlist) =>
          playlist.songs?.some((s: any) => s.songId === songId)
        )
        .map((p) => p._id);

      // Playlists to add the song to (selected but not currently in)
      const playlistsToAdd = selectedPlaylists.filter(
        (playlistId) => !currentPlaylistsWithSong.includes(playlistId)
      );

      // Playlists to remove the song from (currently in but not selected)
      const playlistsToRemove = currentPlaylistsWithSong.filter(
        (playlistId) => !selectedPlaylists.includes(playlistId)
      );

      const promises = [];

      // Add to new playlists
      playlistsToAdd.forEach((playlistId) => {
        promises.push(addSongToPlaylist(playlistId, song));
      });

      // Remove from unselected playlists
      playlistsToRemove.forEach((playlistId) => {
        promises.push(removeSongFromPlaylist(playlistId, songId));
      });

      if (promises.length > 0) {
        await Promise.all(promises);

        const actionText = [];
        if (playlistsToAdd.length > 0) {
          actionText.push(
            `added to ${playlistsToAdd.length} playlist${
              playlistsToAdd.length > 1 ? "s" : ""
            }`
          );
        }
        if (playlistsToRemove.length > 0) {
          actionText.push(
            `removed from ${playlistsToRemove.length} playlist${
              playlistsToRemove.length > 1 ? "s" : ""
            }`
          );
        }

        toast({
          title: "Success",
          description: `"${song.title || song.songTitle}" ${actionText.join(
            " and "
          )}`,
        });
      } else {
        toast({
          title: "Info",
          description: "No changes made to playlists",
        });
      }

      onClose();
      setSelectedPlaylists([]);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update playlists",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedPlaylists([]);
    setNewPlaylistName("");
    setShowCreateForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Add to Playlist</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Song Info */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded overflow-hidden">
              <img
                src={song.cover}
                alt={song.album || song.albumName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {song.title || song.songTitle}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {song.artist || song.artistName}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {song.album || song.albumName} • {formatDuration(song.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {/* Create New Playlist */}
          <div className="mb-4">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-colors"
              >
                <Plus size={16} />
                <span>Create New Playlist</span>
              </button>
            ) : (
              <div className="space-y-3 p-3 border border-gray-600 rounded-lg">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCreatePlaylist()
                  }
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={isCreating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Playlists */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Your Playlists
            </h3>
            {playlists.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No playlists yet. Create your first playlist above!
              </p>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  onClick={() => handlePlaylistToggle(playlist._id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPlaylists.includes(playlist._id)
                      ? "bg-purple-600/20 border border-purple-500/30"
                      : "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center mr-3">
                    {selectedPlaylists.includes(playlist._id) ? (
                      <Check size={16} className="text-white" />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {playlist.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {playlist.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {playlist.songCount} song
                      {playlist.songCount !== 1 ? "s" : ""}
                      {playlist.totalDuration > 0 &&
                        ` • ${formatDuration(playlist.totalDuration)}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToPlaylists}
              disabled={isAdding}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? "Updating..." : "Update Playlists"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistDialog;
