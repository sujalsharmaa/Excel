// src/components/LoginButton.js
import React from 'react';
import {useAuthStore} from '../Store/useStore.js';

export const LoginButton = () => {
  const { login, isLoading } = useAuthStore();

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 mr-2"
    >
      {isLoading ? 'Loading...' : 'Login with Google'}
    </button>
  );
};