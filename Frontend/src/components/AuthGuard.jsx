// src/components/AuthGuard.js
import { useEffect } from 'react';
// import { useRouter } from 'next/router';
import {useAuthStore, useWebSocketStore} from '../Store/useStore.js';
import { LoginButton } from './LoginButton.jsx';
import { useNavigate } from 'react-router-dom';

export const AuthGuard = ({ children }) => {

  const navigate = useNavigate()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {initializeWebSocket} = useWebSocketStore()
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated && !window.location.href.includes('/')) {
  //     console.log("push to / route");
  //     // router.push('/login'); // Uncomment this if you are using Next.js
  //   }
  // }, [isLoading, isAuthenticated]);

  useEffect(() => {
    checkAuth();
    initializeWebSocket();
  }, [checkAuth,initializeWebSocket]);

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//         const currentPath = window.location.pathname;
//         if (currentPath !== '/') {
//             navigate('/'); // Redirect to home if unauthenticated
//         }
//     }
// }, [isLoading, isAuthenticated, navigate]);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <LoginButton/>;
};