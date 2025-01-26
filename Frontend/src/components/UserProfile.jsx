import React from 'react';
import {useAuthStore} from '../Store/useStore.js';

import { useNavigate } from 'react-router-dom';

export const UserProfile = () => {
  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate(); // Get the navigate function

  const handleLogout = async () => {
    await logout(navigate); // Pass the navigate function to logout
  }
  if (!user) return null;

  return (
    <div className="">

      <div className="flex gap-2">
        <img
        className='rounded-full w-11 h-11 mx-2 border-2 border-black'
        src={user.imageurl} alt="" />
        
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 mr-2"
        >
          {isLoading ? 'Loading...' : 'Logout'}
        </button>
      </div>
    </div>
  );
};