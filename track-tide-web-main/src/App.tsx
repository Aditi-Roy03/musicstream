
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Playlists from "./pages/Playlists";
import Favorites from "./pages/Favorites";

import Recent from "./pages/Recent";
import Artists from "./pages/Artists";
import PlayHistory from "./pages/PlayHistory";
import SearchHistory from "./pages/SearchHistory";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { PlayHistoryProvider } from "./contexts/PlayHistoryContext";
import { PlaylistProvider } from "./contexts/PlaylistContext";
import MusicPlayer from "./components/MusicPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MusicPlayerProvider>
        <FavoritesProvider>
          <PlayHistoryProvider>
            <PlaylistProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="search" element={<Search />} />
                    <Route path="playlists" element={<Playlists />} />
                    <Route path="favorites" element={<Favorites />} />

                    <Route path="recent" element={<Recent />} />
                    <Route path="artists" element={<Artists />} />
                    <Route path="play-history" element={<PlayHistory />} />
                    <Route path="search-history" element={<SearchHistory />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MusicPlayer />
              </BrowserRouter>
            </PlaylistProvider>
          </PlayHistoryProvider>
        </FavoritesProvider>
      </MusicPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
