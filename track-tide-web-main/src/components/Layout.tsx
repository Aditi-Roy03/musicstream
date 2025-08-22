
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 text-white">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Layout;
