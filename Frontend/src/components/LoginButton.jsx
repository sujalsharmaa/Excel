// src/components/LoginButton.js
import React from 'react';
import { useAuthStore } from '../Store/useStore.js';

export const LoginButton = () => {
  const { login, isLoading } = useAuthStore();

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className="flex items-center justify-center px-3 py-[6px] text-base font-medium text-black bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google Logo"
        className="w-6 h-6 mr-2"
      />
      {isLoading ? 'Loading...' : 'Login with Google'}
    </button>
  );
};
