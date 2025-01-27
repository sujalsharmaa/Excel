import { create } from 'zustand';
import axios from 'axios';
import { persist } from 'zustand/middleware';
import debounce from 'lodash/debounce';




// Auth store remains the same
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      fileUrl: null, // Add fileUrl to the state
      fileUserName: null,
      setfileUserName: (name) => set({ fileUserName: name }),
      setfileUrl: (url) => set({ fileUrl: url }),

      login: async () => {
        window.location.href = `${import.meta.env.VITE_PUBLIC_API_URL}/auth/google`;
        const res = await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/auth/status`,{withCredentials: true});
        console.log("res =>", res )
      },

      logout: async (navigate) => {
        const {disconnect} = useWebSocketStore.getState()
        const {setData} = useSpreadsheetStore.getState()
        setData(Array(100).fill().map(() => Array(10).fill('')))
        try {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            fileUrl: null,
          });
          await disconnect();

          set({ isLoading: true });
          await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/logout`, {
            withCredentials: true
          });
        } catch (error) {
          set({ error: 'Failed to logout' });
        } finally {
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        const {user,fileUrl} = useAuthStore.getState()
        if (user && fileUrl){
          console.log("checkAuth",user.google_id,fileUrl)
          return
        }
        try {

            set({ isLoading: true });
              const response = await axios.get(
                `${import.meta.env.VITE_PUBLIC_API_URL}/auth/status`,
                  {withCredentials: true} 
              
            );

            console.log(response.data)
    
            if (response.data.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    error: null,
                    fileUrl: response.data.signedUrl, // Update file URL
                });
                if (response.data.signedUrl && !window.location.href.includes(`/file/${response.data.signedUrl}`)) {
                 window.location.href = `http://localhost:5173/file/${response.data.signedUrl}`;
                }
    
                // Redirect only if the user is not already on the file URL
  
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    fileUrl: null,
                });
            }
        } catch (error) {
            set({
                user: null,
                isAuthenticated: false,
                error: 'Authentication check failed',
                fileUrl: null,
            });
        } finally {
            set({ isLoading: false });
        }
    },
    

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        fileUrl: state.fileUrl,
      })
    }
  )
);

// Improved spreadsheet store with local-first updates
export const useSpreadsheetStore = create(
  persist(
    (set, get) => ({
      ROWS: 100,
      COLS: 10,
      data: Array(100).fill().map(() => Array(10).fill('')),
      setData: (data) => set({ data }),
      localUpdates: new Map(), // Track cells being edited locally

      setROWS: (newROWS) => {
        const currentData = get().data;
        const newData = Array(newROWS)
          .fill()
          .map((_, rowIndex) =>
            rowIndex < currentData.length
              ? currentData[rowIndex]
              : Array(get().COLS).fill('')
          );
        set({ ROWS: newROWS, data: newData });
      },

      setCOLS: (newCOLS) => {
        const currentData = get().data;
        const newData = currentData.map((row) =>
          row.length < newCOLS
            ? [...row, ...Array(newCOLS - row.length).fill('')]
            : row.slice(0, newCOLS)
        );
        set({ COLS: newCOLS, data: newData });
      },

      // Immediately update local state and debounce remote updates
      setCellValue: (row, col, value, isRemoteUpdate = false) => {
        const { localUpdates } = get();
      
        // Ensure localUpdates is a Map
        if (!(localUpdates instanceof Map)) {
          console.error('localUpdates is not a Map:', localUpdates);
          set({ localUpdates: new Map() }); // Reset to a new Map if it's not
          return;
        }
      
        const cellKey = `${row}-${col}`;
      
        // If this is a remote update and the cell is being edited locally, ignore it
        if (isRemoteUpdate && localUpdates.has(cellKey)) {
          return;
        }
      
        const newData = [...get().data];
        newData[row][col] = value;
        set({ data: newData });
      
        if (!isRemoteUpdate) {
          // Mark cell as being edited locally
          localUpdates.set(cellKey, Date.now());
          set({ localUpdates });
      
          // Debounce the remote update
          get().debouncedSendUpdate(row, col, value);
      
          // Clear the local update mark after a delay
          setTimeout(() => {
            localUpdates.delete(cellKey);
            set({ localUpdates });
          }, 50); // Adjust this delay as needed
        }
      },

      // Debounced function to send updates to the server
      debouncedSendUpdate: debounce((row, col, value) => {
        const { user } = useAuthStore.getState();
        const { sendUpdate } = useWebSocketStore.getState();
        sendUpdate(row, col, value, user?.google_id);
      }, 1000), // Adjust debounce delay as needed

      resetData: () => {
        set({
          data: Array(get().ROWS).fill().map(() => Array(get().COLS).fill('')),
          localUpdates: new Map()
        });
      },

      importData: (newData) => {
        set({
          ROWS: newData.length,
          COLS: newData[0].length,
          data: newData,
          localUpdates: new Map()
        });
      },
      LoadFile: async (FileLink, navigate) => {
        const {initializeWebSocket} = useWebSocketStore.getState();
        const {setfileUrl,fileUrl,setfileUserName,fileUserName} = useAuthStore.getState();
        if(fileUrl){
          setfileUrl( FileLink );
          await initializeWebSocket();
        }   
         //state change
        try {
          const { importData } = useSpreadsheetStore.getState();
            const response = await axios.get(
                `${import.meta.env.VITE_PUBLIC_API_URL}/file/${FileLink}`,
                { withCredentials: true, responseType: 'text' }
            );
            const name = await axios.get(
              `${import.meta.env.VITE_PUBLIC_API_URL}/file/${FileLink}/name`,
              { withCredentials: true, responseType: 'text' }
          );
            //console.log(FileLink)
    
            const myfilename = JSON.parse(name.data) 
            setfileUserName(myfilename.fileNameForUser)
            console.log("setting name",myfilename.fileNameForUser)
            const csvText = response.data
            console.log("name=>",name)
    
            if (!csvText) {
                throw new Error('No data received from the server');
            }
    
            const rows = csvText.split('\n').map(row =>
                row.split(',').map(cell => cell.replace(/^"|"$/g, ''))
            );
    
            importData(rows);
        } catch (error) {
            console.error('Error loading file:', error);
            navigate('/error'); // Redirect to an error page
        }
    },
    LoadAdminData: async() =>{
      const res = await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/admin`,
        {withCredentials:true}
      )
      console.log("data => ",res)
      return res
      
    }
    
    }),
    {
      name: 'spreadsheet-storage',
      // Add a custom merge function to ensure `localUpdates` is always a Map
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          localUpdates: new Map(persistedState.localUpdates || []), // Ensure localUpdates is a Map
        }
      }
    }
  )
);

// Improved WebSocket store with better update handling
export const useWebSocketStore = create(
  persist(
    (set, get) => ({
      socket: null,
      isConnected: false,
      connectionError: null,
      pendingUpdates: [],

      initializeWebSocket: () => {
        try {
          const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws`);

          ws.onopen = () => {
            set({
              socket: ws,
              isConnected: true,
              connectionError: null,
            });
            get().sendPendingUpdates();
            const {isAuthenticated,fileUrl,user} = useAuthStore.getState()
            if (isAuthenticated && fileUrl) {
              console.log("file url changed",fileUrl)
              ws.send(JSON.stringify({
                userID: user.google_id,
                fileName: fileUrl
              }))
            }
          };

          ws.onclose = () => {
            set({
              socket: null,
              isConnected: false,
            });
            setTimeout(() => get().initializeWebSocket(), 500);
          };

          ws.onerror = (error) => {
            set({
              connectionError: 'Failed to connect to server',
              isConnected: false,
            });
          };

          ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            const { setCellValue } = useSpreadsheetStore.getState();
            
            // Apply remote updates with flag
            setCellValue(update.row, update.col, update.value, true);

            // Send acknowledgment
            if (update.updateId) {
              ws.send(JSON.stringify({ 
                type: 'ACK', 
                updateId: update.updateId,
                clientId: useAuthStore.getState().user?.google_id
              }));
            }
          };
        } catch (error) {
          set({
            connectionError: 'Failed to initialize WebSocket connection',
            isConnected: false,
          });
        }
      },

      sendUpdate: (row, col, value, id) => {
        const {fileUrl} = useAuthStore.getState()
        const update = { type: 'UPDATE', row, col, value, id,fileNameFromUser: fileUrl };
        const { socket, isConnected } = get();

        if (isConnected && socket) {
          socket.send(JSON.stringify(update));
        } else {
          set((state) => ({
            pendingUpdates: [...state.pendingUpdates, update],
          }));
        }
      },

      sendPendingUpdates: () => {
        const { socket, pendingUpdates } = get();
        if (socket && pendingUpdates.length > 0) {
          pendingUpdates.forEach((update) => {
            socket.send(JSON.stringify(update));
          });
          set({ pendingUpdates: [] });
        }
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          socket.close();
          set({
            socket: null,
            isConnected: false,
          });
        }
      },
    }),
    {
      name: 'websocket-storage',
      partialize: (state) => ({
        pendingUpdates: state.pendingUpdates,
      }),
    }
  )
);