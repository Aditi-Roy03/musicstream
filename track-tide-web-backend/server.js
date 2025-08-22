const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Mahmudul:HasanArmanAnas3%23@cluster0.ukjk0ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((error) => {
    console.error("❌ Error connecting to MongoDB:", error);
    console.log("Continuing without database connection...");
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
});

const User = mongoose.model("User", userSchema);

// Search History Schema
const searchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);

// User Liked Songs Schema
const userLikedSongsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songId: { type: String, required: true },
  songTitle: { type: String, required: true },
  artistName: { type: String, required: true },
  albumName: { type: String, required: true },
  duration: { type: Number, required: true },
  cover: { type: String, required: true },
  preview: { type: String, required: true },
  likedAt: { type: Date, default: Date.now },
  context: { type: String, enum: ['search', 'playlist', 'recommendation'], default: 'search' }
});

userLikedSongsSchema.index({ userId: 1, songId: 1 }, { unique: true });
userLikedSongsSchema.index({ userId: 1, likedAt: -1 });

const UserLikedSongs = mongoose.model("UserLikedSongs", userLikedSongsSchema);

// Play History Schema
const playHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songId: { type: String, required: true },
  songTitle: { type: String, required: true },
  artistName: { type: String, required: true },
  albumName: { type: String, required: true },
  duration: { type: Number, required: true },
  cover: { type: String, required: true },
  preview: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

playHistorySchema.index({ userId: 1, playedAt: -1 });
playHistorySchema.index({ userId: 1, songId: 1 });

const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);

// Playlist Schema
const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: false },
  coverImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  totalDuration: { type: Number, default: 0 },
  tags: [{ type: String }]
});

playlistSchema.index({ ownerId: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1 });

const Playlist = mongoose.model("Playlist", playlistSchema);

// Playlist Songs Schema
const playlistSongSchema = new mongoose.Schema({
  playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', required: true },
  songId: { type: String, required: true },
  songTitle: { type: String, required: true },
  artistName: { type: String, required: true },
  albumName: { type: String, required: true },
  duration: { type: Number, required: true },
  cover: { type: String, required: true },
  preview: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
  position: { type: Number, default: 0 }
});

playlistSongSchema.index({ playlistId: 1, position: 1 });
playlistSongSchema.index({ playlistId: 1, songId: 1 }, { unique: true });

const PlaylistSong = mongoose.model("PlaylistSong", playlistSongSchema);

// User Follows Schema
const userFollowsSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followedType: { type: String, enum: ['artist', 'user'], required: true },
  followedId: { type: String, required: true }, // MusicBrainz artist ID or ObjectId for users
  followedAt: { type: Date, default: Date.now },
  notificationsEnabled: { type: Boolean, default: true }
});

userFollowsSchema.index({ followerId: 1, followedType: 1, followedId: 1 }, { unique: true });
userFollowsSchema.index({ followedId: 1, followedType: 1 });
userFollowsSchema.index({ followedAt: -1 });

const UserFollows = mongoose.model("UserFollows", userFollowsSchema);

// Authentication routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Signup error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Search endpoint
app.get("/api/songs/search", async (req, res) => {
  try {
    const { q } = req.query;
    const token = req.headers.authorization?.split(' ')[1];

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    // Fetch songs from Deezer API
    const response = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
    const songs = response.data.data || [];

    // Transform songs data
    const transformedSongs = songs.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist.name,
      album: song.album.title,
      duration: song.duration,
      preview: song.preview,
      cover: song.album.cover_medium,
      cover_small: song.album.cover_small,
      artistPicture: song.artist.picture_medium,
      link: song.link
    }));

    // Save search history if user is authenticated
    if (token) {
              try {
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // Check if search query already exists for this user
          const existingSearch = await SearchHistory.findOne({
            userId: decoded.userId,
            query: q
          });

          if (existingSearch) {
            // Update timestamp to move it to the top
            existingSearch.timestamp = new Date();
            await existingSearch.save();
          } else {
            // Create new search history
            const searchHistory = new SearchHistory({
              userId: decoded.userId,
              query: q
            });
            await searchHistory.save();
          }
        } catch (error) {
          console.log("Could not save search history - user not authenticated");
        }
    }

    res.json({
      songs: transformedSongs,
      total: response.data.total || 0,
      query: q
    });

  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.status(500).json({ error: "Failed to search songs" });
  }
});

// Get search history endpoint
app.get("/api/search/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const history = await SearchHistory.find({ userId: decoded.userId })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({ history });
  } catch (error) {
    console.error("❌ Get history error:", error.message);
    res.status(500).json({ error: "Failed to get search history" });
  }
});

// Delete search history item endpoint
app.delete("/api/search/history/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    console.log("Deleting search history item:", id, "for user:", decoded.userId);

    const deletedItem = await SearchHistory.findOneAndDelete({
      _id: id,
      userId: decoded.userId
    });

    if (!deletedItem) {
      console.log("No item found to delete");
      return res.status(404).json({ error: "Search history item not found" });
    }

    console.log("Successfully deleted item:", deletedItem);
    res.json({ message: "Search history item deleted successfully" });
  } catch (error) {
    console.error("❌ Delete history error:", error.message);
    res.status(500).json({ error: "Failed to delete search history item" });
  }
});

// Get user's liked songs
app.get("/api/favorites", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const likedSongs = await UserLikedSongs.find({ userId: decoded.userId })
      .sort({ likedAt: -1 });

    res.json({ favorites: likedSongs });
  } catch (error) {
    console.error("❌ Get favorites error:", error.message);
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

// Add song to favorites
app.post("/api/favorites", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { songId, songTitle, artistName, albumName, duration, cover, preview, context = 'search' } = req.body;

    if (!songId || !songTitle || !artistName || !albumName || !duration || !cover || !preview) {
      return res.status(400).json({ error: "All song details are required" });
    }

    // Check if song is already liked
    const existingLike = await UserLikedSongs.findOne({
      userId: decoded.userId,
      songId: songId
    });

    if (existingLike) {
      return res.status(400).json({ error: "Song is already in favorites" });
    }

    const likedSong = new UserLikedSongs({
      userId: decoded.userId,
      songId,
      songTitle,
      artistName,
      albumName,
      duration,
      cover,
      preview,
      context
    });

    await likedSong.save();

    console.log(`✅ Song added to favorites: ${songTitle} by ${artistName}`);

    res.status(201).json({
      message: "Song added to favorites successfully",
      favorite: likedSong
    });
  } catch (error) {
    console.error("❌ Add to favorites error:", error.message);
    res.status(500).json({ error: "Failed to add song to favorites" });
  }
});

// Remove song from favorites
app.delete("/api/favorites/:songId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { songId } = req.params;

    const deletedFavorite = await UserLikedSongs.findOneAndDelete({
      userId: decoded.userId,
      songId: songId
    });

    if (!deletedFavorite) {
      return res.status(404).json({ error: "Song not found in favorites" });
    }

    console.log(`✅ Song removed from favorites: ${deletedFavorite.songTitle}`);
    
    res.json({
      message: "Song removed from favorites successfully",
      removedSong: deletedFavorite
    });
  } catch (error) {
    console.error("❌ Remove from favorites error:", error.message);
    res.status(500).json({ error: "Failed to remove song from favorites" });
  }
});

// Add song to play history
app.post("/api/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { songId, songTitle, artistName, albumName, duration, cover, preview } = req.body;

    if (!songId || !songTitle || !artistName || !albumName || !duration || !cover || !preview) {
      return res.status(400).json({ error: "All song details are required" });
    }

    // Check if song already exists in history for this user
    const existingRecord = await PlayHistory.findOne({
      userId: decoded.userId,
      songId: songId
    });

    if (existingRecord) {
      // Update the timestamp to move it to the top
      existingRecord.playedAt = new Date();
      await existingRecord.save();
      
      console.log(`✅ Song updated in play history: ${songTitle} by ${artistName}`);
      
      res.status(200).json({
        message: "Song updated in play history successfully",
        playRecord: existingRecord
      });
    } else {
      // Create new record
      const playRecord = new PlayHistory({
        userId: decoded.userId,
        songId,
        songTitle,
        artistName,
        albumName,
        duration,
        cover,
        preview
      });

      await playRecord.save();

      console.log(`✅ Song added to play history: ${songTitle} by ${artistName}`);

      res.status(201).json({
        message: "Song added to play history successfully",
        playRecord
      });
    }
  } catch (error) {
    console.error("❌ Add to play history error:", error.message);
    res.status(500).json({ error: "Failed to add song to play history" });
  }
});

// Get user's play history
app.get("/api/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const playHistory = await PlayHistory.find({ userId: decoded.userId })
      .sort({ playedAt: -1 })
      .limit(20);

    res.json({ playHistory });
  } catch (error) {
    console.error("❌ Get play history error:", error.message);
    res.status(500).json({ error: "Failed to get play history" });
  }
});

// Playlist API Endpoints

// Get user's playlists
app.get("/api/playlists", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const playlists = await Playlist.find({ ownerId: decoded.userId })
      .sort({ updatedAt: -1 });

        // Get song count and sample songs for each playlist
    const playlistsWithSongCount = await Promise.all(
      playlists.map(async (playlist) => {
        const songCount = await PlaylistSong.countDocuments({ playlistId: playlist._id });
        const totalDuration = await PlaylistSong.aggregate([
          { $match: { playlistId: playlist._id } },
          { $group: { _id: null, total: { $sum: "$duration" } } }
        ]);
        
        // Get all songs to check if current song is in playlist
        const allSongs = await PlaylistSong.find({ playlistId: playlist._id })
          .select('songId songTitle artistName');
        
        console.log(`Playlist "${playlist.name}" has ${allSongs.length} songs:`, allSongs.map(s => s.songId));
        
        return {
          ...playlist.toObject(),
          songCount,
          totalDuration: totalDuration[0]?.total || 0,
          songs: allSongs
        };
      })
    );

    res.json({ playlists: playlistsWithSongCount });
  } catch (error) {
    console.error("❌ Get playlists error:", error.message);
    res.status(500).json({ error: "Failed to get playlists" });
  }
});

// Create new playlist
app.post("/api/playlists", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, description = '', isPublic = false } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    const playlist = new Playlist({
      name: name.trim(),
      description: description.trim(),
      ownerId: decoded.userId,
      isPublic
    });

    await playlist.save();

    console.log(`✅ Playlist created: ${name} by user ${decoded.userId}`);

    res.status(201).json({
      message: "Playlist created successfully",
      playlist: {
        ...playlist.toObject(),
        songCount: 0,
        totalDuration: 0
      }
    });
  } catch (error) {
    console.error("❌ Create playlist error:", error.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// Get playlist details with songs
app.get("/api/playlists/:playlistId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { playlistId } = req.params;

    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      ownerId: decoded.userId 
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const songs = await PlaylistSong.find({ playlistId })
      .sort({ position: 1, addedAt: -1 });

    const totalDuration = songs.reduce((total, song) => total + song.duration, 0);

    res.json({
      playlist: {
        ...playlist.toObject(),
        songCount: songs.length,
        totalDuration
      },
      songs
    });
  } catch (error) {
    console.error("❌ Get playlist details error:", error.message);
    res.status(500).json({ error: "Failed to get playlist details" });
  }
});

// Add song to playlist
app.post("/api/playlists/:playlistId/songs", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { playlistId } = req.params;
    const { songId, songTitle, artistName, albumName, duration, cover, preview } = req.body;

    if (!songId || !songTitle || !artistName || !albumName || !duration || !cover || !preview) {
      return res.status(400).json({ error: "All song details are required" });
    }

    // Check if playlist exists and user owns it
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      ownerId: decoded.userId 
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if song is already in playlist
    const existingSong = await PlaylistSong.findOne({
      playlistId,
      songId
    });

    if (existingSong) {
      return res.status(400).json({ error: "Song is already in this playlist" });
    }

    // Get the next position
    const lastSong = await PlaylistSong.findOne({ playlistId })
      .sort({ position: -1 });
    const nextPosition = (lastSong?.position || 0) + 1;

    const playlistSong = new PlaylistSong({
      playlistId,
      songId,
      songTitle,
      artistName,
      albumName,
      duration,
      cover,
      preview,
      addedBy: decoded.userId,
      position: nextPosition
    });

    await playlistSong.save();

    // Update playlist's updatedAt timestamp
    playlist.updatedAt = new Date();
    await playlist.save();

    console.log(`✅ Song added to playlist: ${songTitle} -> ${playlist.name}`);

    res.status(201).json({
      message: "Song added to playlist successfully",
      playlistSong
    });
  } catch (error) {
    console.error("❌ Add song to playlist error:", error.message);
    res.status(500).json({ error: "Failed to add song to playlist" });
  }
});

// Remove song from playlist
app.delete("/api/playlists/:playlistId/songs/:songId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { playlistId, songId } = req.params;

    // Check if playlist exists and user owns it
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      ownerId: decoded.userId 
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const deletedSong = await PlaylistSong.findOneAndDelete({
      playlistId,
      songId
    });

    if (!deletedSong) {
      return res.status(404).json({ error: "Song not found in playlist" });
    }

    // Update playlist's updatedAt timestamp
    playlist.updatedAt = new Date();
    await playlist.save();

    console.log(`✅ Song removed from playlist: ${deletedSong.songTitle} from ${playlist.name}`);

    res.json({
      message: "Song removed from playlist successfully",
      removedSong: deletedSong
    });
  } catch (error) {
    console.error("❌ Remove song from playlist error:", error.message);
    res.status(500).json({ error: "Failed to remove song from playlist" });
  }
});

// Delete playlist
app.delete("/api/playlists/:playlistId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { playlistId } = req.params;

    // Check if playlist exists and user owns it
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      ownerId: decoded.userId 
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Delete all songs in the playlist
    await PlaylistSong.deleteMany({ playlistId });

    // Delete the playlist
    await Playlist.findByIdAndDelete(playlistId);

    console.log(`✅ Playlist deleted: ${playlist.name} by user ${decoded.userId}`);

    res.json({
      message: "Playlist deleted successfully",
      deletedPlaylist: playlist
    });
  } catch (error) {
    console.error("❌ Delete playlist error:", error.message);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// Update playlist details
app.put("/api/playlists/:playlistId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { playlistId } = req.params;
    const { name, description, isPublic } = req.body;

    // Check if playlist exists and user owns it
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      ownerId: decoded.userId 
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Update fields
    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (isPublic !== undefined) playlist.isPublic = isPublic;
    
    playlist.updatedAt = new Date();
    await playlist.save();

    console.log(`✅ Playlist updated: ${playlist.name}`);

    res.json({
      message: "Playlist updated successfully",
      playlist
    });
  } catch (error) {
    console.error("❌ Update playlist error:", error.message);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

// Artist API Endpoints

// Get artists you follow
app.get("/api/artists/following", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const following = await UserFollows.find({ 
      followerId: decoded.userId, 
      followedType: 'artist' 
    }).sort({ followedAt: -1 });

    // Fetch artist details from Deezer API
    const artistsWithDetails = await Promise.all(
      following.map(async (follow) => {
        try {
          const response = await axios.get(`https://api.deezer.com/artist/${follow.followedId}`);
          const artist = response.data;
          return {
            id: artist.id || follow.followedId,
            name: artist.name || 'Unknown Artist',
            picture: artist.picture_medium || 'https://via.placeholder.com/300x300?text=Artist',
            picture_big: artist.picture_big || artist.picture_medium || 'https://via.placeholder.com/300x300?text=Artist',
            followers: artist.nb_fan || 0,
            genre: artist.genre || 'Unknown',
            isFollowing: true,
            followedAt: follow.followedAt
          };
        } catch (error) {
          console.error(`Error fetching artist ${follow.followedId}:`, error.message);
          return null;
        }
      })
    );

    const validArtists = artistsWithDetails.filter(artist => artist !== null);

    res.json({ artists: validArtists });
  } catch (error) {
    console.error("❌ Get following artists error:", error.message);
    res.status(500).json({ error: "Failed to get following artists" });
  }
});

// Get popular artists (random selection)
app.get("/api/artists/popular", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    
    // Get user ID if authenticated
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.log("Invalid token, proceeding without user context");
      }
    }
    
    // Popular artist IDs from Deezer (you can expand this list)
    const popularArtistIds = [
      13, 27, 412, 75798, 1039, 116, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,
      131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150
    ];

    // Shuffle and take random artists
    const shuffled = popularArtistIds.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, parseInt(limit));

    // Get user's following artists if authenticated
    let userFollowingArtists = [];
    if (userId) {
      const following = await UserFollows.find({ 
        followerId: userId, 
        followedType: 'artist' 
      });
      userFollowingArtists = following.map(follow => follow.followedId);
    }

    // Fetch artist details from Deezer API
    const artists = await Promise.all(
      selectedIds.map(async (artistId) => {
        try {
          const response = await axios.get(`https://api.deezer.com/artist/${artistId}`);
          const artist = response.data;
          const isFollowing = userFollowingArtists.includes(artistId.toString());
          
          return {
            id: artist.id || artistId,
            name: artist.name || 'Unknown Artist',
            picture: artist.picture_medium || 'https://via.placeholder.com/300x300?text=Artist',
            picture_big: artist.picture_big || artist.picture_medium || 'https://via.placeholder.com/300x300?text=Artist',
            followers: artist.nb_fan || 0,
            genre: artist.genre || 'Unknown',
            isFollowing: isFollowing
          };
        } catch (error) {
          console.error(`Error fetching artist ${artistId}:`, error.message);
          return null;
        }
      })
    );

    const validArtists = artists.filter(artist => artist !== null);

    res.json({ artists: validArtists });
  } catch (error) {
    console.error("❌ Get popular artists error:", error.message);
    res.status(500).json({ error: "Failed to get popular artists" });
  }
});

// Follow an artist
app.post("/api/artists/:artistId/follow", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { artistId } = req.params;

    // Check if already following
    const existingFollow = await UserFollows.findOne({
      followerId: decoded.userId,
      followedType: 'artist',
      followedId: artistId
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this artist" });
    }

    const follow = new UserFollows({
      followerId: decoded.userId,
      followedType: 'artist',
      followedId: artistId
    });

    await follow.save();

    console.log(`✅ User ${decoded.userId} started following artist ${artistId}`);

    res.status(201).json({
      message: "Artist followed successfully",
      follow
    });
  } catch (error) {
    console.error("❌ Follow artist error:", error.message);
    res.status(500).json({ error: "Failed to follow artist" });
  }
});

// Unfollow an artist
app.delete("/api/artists/:artistId/follow", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { artistId } = req.params;

    const deletedFollow = await UserFollows.findOneAndDelete({
      followerId: decoded.userId,
      followedType: 'artist',
      followedId: artistId
    });

    if (!deletedFollow) {
      return res.status(404).json({ error: "Not following this artist" });
    }

    console.log(`✅ User ${decoded.userId} unfollowed artist ${artistId}`);

    res.json({
      message: "Artist unfollowed successfully",
      removedFollow: deletedFollow
    });
  } catch (error) {
    console.error("❌ Unfollow artist error:", error.message);
    res.status(500).json({ error: "Failed to unfollow artist" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "Track Tide Web Backend is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Track Tide Web Backend API",
    status: "Server is running",
    endpoints: {
      auth: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      search: "GET /api/songs/search",
      health: "GET /api/health",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/songs/search`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});
