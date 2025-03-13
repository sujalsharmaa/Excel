// src/components/AuthGuard.js
import { useEffect } from 'react';
import {useAuthStore, useWebSocketStore} from '../Store/useStore.js';
import { LoginButton } from './LoginButton.jsx';


export const AuthGuard = ({ children }) => {

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {initializeWebSocket} = useWebSocketStore()


  useEffect(() => {
    checkAuth();
   initializeWebSocket();
  }, [checkAuth,initializeWebSocket]);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <LoginButton/>;
};