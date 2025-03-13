import React, { useState } from 'react';
import { useAuthStore } from '../Store/useStore.js';
import { useNavigate } from 'react-router-dom';

export const UserProfile = () => {
  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const handleLogout = async () => {
    await logout(navigate);
  };

  if (!user) return null;

  return (
    <div className="relative flex items-center space-x-3">
      <img
        className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
        src={user.imageurl}
        alt="User Profile"
      />
      
      <button
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg disabled:opacity-50 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
      >
        {isLoading ? 'Loading...' : 'Logout'}
      </button>
      
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-lg font-semibold mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600"
                disabled={isLoading}
              >
                {isLoading ? 'Logging out...' : 'Confirm Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
