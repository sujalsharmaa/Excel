import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { throttle } from 'lodash';
import { useWebSocketStore, useAuthStore } from '@/Store/useStore.js';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

// Helper function to compare scene states
const areElementsEqual = (prevElements, newElements) => {
  if (!prevElements || !newElements) return false;
  if (prevElements.length !== newElements.length) return false;

  return prevElements.every((prevEl, index) => {
    const newEl = newElements[index];
    return (
      prevEl.id === newEl.id &&
      prevEl.version === newEl.version &&
      prevEl.versionNonce === newEl.versionNonce
    );
  });
};

const ExcalidrawWrapper = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const lastReceivedScene = useRef(null);
  const lastSentScene = useRef(null); // Track sent state to avoid redundant emits
  
  const { socket: ws, initializeWebSocket } = useWebSocketStore();
  const { fileUrl: fileNameFromUser, user, isLoading, setIsLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]); // Fixed invalid dependency array

  const handleChange = useCallback(
    throttle((elements, appState) => {
      if (!ws || !fileNameFromUser || !user || !excalidrawAPI) return;

      // 1. Prevent Ping-Pong Effect: If elements exactly match what we just received, do NOT echo them back.
      if (areElementsEqual(lastReceivedScene.current?.elements, elements)) {
        return;
      }

      // 2. Prevent redundant sends: If elements haven't changed since we last sent them, do NOT send.
      if (areElementsEqual(lastSentScene.current?.elements, elements)) {
        return;
      }

      const currentScene = { elements }; // Don't sync appState dynamically to avoid resetting the other user's selected tools/zoom
      lastSentScene.current = currentScene;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'DRAWING_UPDATE',
          fileNameFromUser,
          scene: currentScene,
          sender: {
            id: user.google_id,
            name: user.name,
            color: user.color,
            lastActive: Date.now()
          }
        }));
      }
    }, 100), // Slightly lower throttle for smoother drawing sync
    [ws, fileNameFromUser, user, excalidrawAPI]
  );

  useEffect(() => {
    if (!ws || !excalidrawAPI) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'DRAWING_HISTORY':
            if (data.history && excalidrawAPI) {
              lastReceivedScene.current = data.history;
              excalidrawAPI.updateScene({
                elements: data.history.elements,
                appState: data.history.appState, // Safe to set on initial load
                commitToHistory: false
              });
            }
            break;
            
          case 'DRAWING_UPDATE':
            if (data.scene && data.sender.id && user && data.sender.id !== user.google_id) {
              const currentElements = excalidrawAPI.getSceneElements();
              
              if (!areElementsEqual(currentElements, data.scene.elements)) {
                lastReceivedScene.current = data.scene;
                excalidrawAPI.updateScene({
                  elements: data.scene.elements,
                  // We intentionally DO NOT update appState here anymore so we don't interrupt active users
                  commitToHistory: false
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };
    
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    }
  }, [ws, excalidrawAPI, user]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && fileNameFromUser && user) {
      try {
        ws.send(JSON.stringify({
          type: 'GET_DRAWING_HISTORY',
          fileNameFromUser,
          id: user.google_id
        }));
      } catch (error) {
        console.error('Error sending GET_DRAWING_HISTORY:', error);
      }
    }
  }, [ws, fileNameFromUser, user, excalidrawAPI]);

  const handleClose = async () => {
    setIsLoading(true);
    if (excalidrawAPI && ws && ws.readyState === WebSocket.OPEN && fileNameFromUser && user) {
      try {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        
        ws.send(JSON.stringify({
          type: 'SAVE_DRAWING',
          fileNameFromUser,
          scene: {
            elements,
            appState
          },
          id: user.google_id
        }));
      } catch (error) {
        console.error('Error saving drawing:', error);
      }
    }
    navigate(-1);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white" style={{zIndex: 1500}}>
      <Button 
        className="absolute top-4 right-4 bg-red-500"
        onClick={handleClose}
        style={{zIndex: 1500}}
      >
        <X className="w-4 h-4" />
      </Button>
      
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        initialData={{
          appState: {
            collaborators: [],
          },
        }}
        theme="dark"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            theme: true
          }
        }}
        isCollaborating={true} // CRITICAL FIX: set to true to protect in-progress strokes
        gridModeEnabled={true}
      />
      {isLoading && <LoadingSpinner/>}
    </div>
  );
};

export default ExcalidrawWrapper;