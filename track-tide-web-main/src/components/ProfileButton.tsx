
import React from 'react';
import { User, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileButton = () => {
  const navigate = useNavigate();
  const { stopMusic } = useMusicPlayer();
  const [user, setUser] = React.useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogOut = () => {
    stopMusic();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/signin');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">
              {isLoggedIn ? user?.name || 'User' : 'Guest'}
            </p>
            <p className="text-xs text-gray-400">
              {isLoggedIn ? user?.email || 'User' : 'Not signed in'}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-gray-900 border-gray-700" 
        align="end" 
        side="top"
      >
        {isLoggedIn ? (
          <>
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem 
              onClick={handleLogOut}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem 
              onClick={handleSignIn}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign in</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleSignUp}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Sign up</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;
