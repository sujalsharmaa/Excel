// src/components/AuthGuard.js
import { useEffect } from 'react';
import { useAuthStore, useWebSocketStore } from '../Store/useStore.js';

export const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading,user } = useAuthStore();
  const { initializeWebSocket } = useWebSocketStore();
  const { initGoogleAuth, renderGoogleButton } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await initGoogleAuth();
      if (document.getElementById('google-login-button')) {
        renderGoogleButton('google-login-button');
      }
    };
    
    initAuth();
  }, [user,isAuthenticated,initGoogleAuth]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <div className="flex justify-center items-center">
      <div className="">
        <div id="google-login-button"></div>
      </div>
    </div>
  );
};