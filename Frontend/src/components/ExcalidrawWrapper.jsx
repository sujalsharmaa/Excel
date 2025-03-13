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
  const { socket: ws,initializeWebSocket } = useWebSocketStore();
  const { fileUrl: fileNameFromUser, user,isLoading,setIsLoading } = useAuthStore();
  const navigate = useNavigate();


useEffect(()=>{
  initializeWebSocket()
},[ExcalidrawWrapper])
  
  const handleChange = useCallback(
    // handles request/sending
    throttle((elements, appState) => {
      if (!ws || !fileNameFromUser || !user) {
          return
      };

      const currentScene = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
        },
      };



      // Only send if the scene has actually changed
      if (!areElementsEqual(lastReceivedScene.current?.elements, elements)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
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
      }
    }, 150),
    [ws, fileNameFromUser, user]
  );

  useEffect(() => {
    if (!ws || !excalidrawAPI) {

       return
    };

    const handleMessage = (event) => {
      // handles receive
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'DRAWING_HISTORY':

            console.log("drawing history", data);
            if (data.history && excalidrawAPI) {
              excalidrawAPI.updateScene({
                elements: data.history.elements,
                appState: data.history.appState,
                commitToHistory: false
              })}
    
            break;
            
          case 'DRAWING_UPDATE':
            console.log("we got update");
           
            // Add an extra check to ensure we're not processing our own updates
            if (data.scene && data.sender.id && user && data.sender.id !== user.google_id) {
              const currentElements = excalidrawAPI.getSceneElements();
              
              // Only update if the scene has actually changed
              if (!areElementsEqual(currentElements, data.scene.elements)) {
                lastReceivedScene.current = data.scene;  // Add this line to track last received
                excalidrawAPI.updateScene({
                  elements: data.scene.elements,
                  appState: data.scene.appState,
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
    return async() => {
      ws.removeEventListener('message', handleMessage);
 
    }
  }, [ws, excalidrawAPI, user]);

  // Separate effect for getting drawing history to avoid null reference issues
  useEffect(() => {
    // Only request drawing history when all dependencies are available
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

  const handleClose = async() => {
    setIsLoading(true)
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
    setIsLoading(false)
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
          isCollaborating={false}
          gridModeEnabled={true}
        />
         {isLoading && <LoadingSpinner/>}
      </div>
 
  );
};

export default ExcalidrawWrapper;