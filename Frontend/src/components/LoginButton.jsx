// src/components/LoginButton.js
import React from 'react';
import {useAuthStore} from '../Store/useStore.js';

export const LoginButton = () => {
  const { login, isLoading } = useAuthStore();

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className="px-4 py-2 bg-pink-600 text-white rounded mr-2"
    >
      {isLoading ? 'Loading...' : 'Login with Google'}
    </button>
  );
};