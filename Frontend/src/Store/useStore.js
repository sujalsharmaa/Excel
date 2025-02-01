import { create } from 'zustand';
import axios from 'axios';
import { persist } from 'zustand/middleware';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';


class SparseMatrix {
  constructor() {
    this.data = new Map();
  }

  // Get value at position
  get(row, col) {
    return this.data.get(`${row},${col}`) || '';
  }

  // Set value at position
  set(row, col, value) {
    if (value === '' || value === null || value === undefined) {
      this.data.delete(`${row},${col}`);
    } else {
      this.data.set(`${row},${col}`, value);
    }
  }

  // Get all non-empty cells
  getNonEmptyCells() {
    return Array.from(this.data.entries()).map(([key, value]) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col, value };
    });
  }

  // Convert range to array for formulas
  getRange(startRow, startCol, endRow, endCol) {
    const result = [];
    for (let i = startRow; i <= endRow; i++) {
      const row = [];
      for (let j = startCol; j <= endCol; j++) {
        row.push(this.get(i, j));
      }
      result.push(row);
    }
    return result;
  }

  // Clear all data
  clear() {
    this.data.clear();
  }

  // Import data from 2D array
  importFromArray(array) {
    this.clear();
    array.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value !== '') {
          this.set(i, j, value);
        }
      });
    });
  }

  // Export to 2D array for rendering
  exportToArray(rows, cols) {
    const result = Array(rows).fill().map(() => Array(cols).fill(''));
    this.data.forEach((value, key) => {
      const [row, col] = key.split(',').map(Number);
      if (row < rows && col < cols) {
        result[row][col] = value;
      }
    });
    return result;
  }
}

// Chunk management for handling large datasets
class ChunkManager {
  constructor(chunkSize = 100) {
    this.chunks = new Map();
    this.chunkSize = chunkSize;
  }

  getChunkKey(row, col) {
    const chunkRow = Math.floor(row / this.chunkSize);
    const chunkCol = Math.floor(col / this.chunkSize);
    return `${chunkRow},${chunkCol}`;
  }

  getOrCreateChunk(chunkKey) {
    if (!this.chunks.has(chunkKey)) {
      this.chunks.set(chunkKey, new SparseMatrix());
    }
    return this.chunks.get(chunkKey);
  }

  get(row, col) {
    const chunkKey = this.getChunkKey(row, col);
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return '';
    return chunk.get(row % this.chunkSize, col % this.chunkSize);
  }

  set(row, col, value) {
    const chunkKey = this.getChunkKey(row, col);
    const chunk = this.getOrCreateChunk(chunkKey);
    chunk.set(row % this.chunkSize, col % this.chunkSize, value);
  }
}


// Auth store remains the same
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      writePermission: null,
      setWritePermission: (permission) =>set({writePermission: permission}),
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
      undoStack: [],
      redoStack: [],
      ROWS: 100,
      COLS: 10,
      data: Array(100).fill().map(() => Array(10).fill('')),
      setData: (data) => set({ data }),
      isLoading: false,
      setIsLoading: (state) => set({ isLoading: state }),
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
        const { localUpdates, data } = get();
      
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
      
        const prevValue = data[row][col];
        const newData = data.map((r, i) => 
          i === row ? [...r.slice(0, col), value, ...r.slice(col + 1)] : r
        );

        set({ data: newData });
      
        if (!isRemoteUpdate) {
          set((state) => ({
            undoStack: [...state.undoStack, [{ row, col, prevValue, newValue: value }]],
            redoStack: [],
          }));
      
          // Debounce the remote update
          get().debouncedSendUpdate(row, col, value);
      
          // Clear the local update mark after a delay
          setTimeout(() => {
            localUpdates.delete(cellKey);
            set({ localUpdates });
          }, 5000); // Adjust this delay as needed
        }
      },

      // Debounced function to send updates to the server
      debouncedSendUpdate: debounce((row, col, value) => {
        const { user } = useAuthStore.getState();
        const { sendUpdate } = useWebSocketStore.getState();
        sendUpdate(row, col, value, user?.google_id);
      }, 1000), // Adjust debounce delay as needed

      undo: () => {
        const { undoStack, data } = get();
        if (!undoStack.length) return;

        const lastAction = undoStack[undoStack.length - 1];
        const newData = data.map(row => [...row]);
        const redoAction = [];

        lastAction.forEach(({ row, col, prevValue, newValue }) => {
          newData[row][col] = prevValue;
          redoAction.push({ row, col, prevValue: newValue, newValue: prevValue });
        });

        set({
          data: newData,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...get().redoStack, redoAction],
        });

        lastAction.forEach(({ row, col, prevValue }) => {
          get().debouncedSendUpdate(row, col, prevValue);
        });
      },

      redo: () => {
        const { redoStack, data } = get();
        if (!redoStack.length) return;

        const lastRedo = redoStack[redoStack.length - 1];
        const newData = data.map(row => [...row]);
        const undoAction = [];

        lastRedo.forEach(({ row, col, prevValue, newValue }) => {
          newData[row][col] = newValue;
          undoAction.push({ row, col, prevValue, newValue });
        });

        set({
          data: newData,
          undoStack: [...get().undoStack, undoAction],
          redoStack: redoStack.slice(0, -1),
        });

        lastRedo.forEach(({ row, col, newValue }) => {
          get().debouncedSendUpdate(row, col, newValue);
        });
      },

          // In useSpreadsheetStore
      renameFile: async (fileId, newFileName) => {
      try {
        const { user } = useAuthStore.getState();
        // console.log("file id =>",fileId)
        await axios.post(
          `${import.meta.env.VITE_PUBLIC_API_URL}/file/rename`,
          { file_Old_name: fileId, fileNewName: newFileName },
          { withCredentials: true }
        );
        return await get().LoadAdminData(); // Refresh data after rename
      } catch (error) {
        console.error('Error renaming file:', error);
        throw error;
      }
      },

      // In useSpreadsheetStore actions
    createFile: async (fileName, users) => {
      try {
        const { LoadFile } = useSpreadsheetStore.getState();
        const { user } = useAuthStore.getState();
        const response = await axios.post(
          `${import.meta.env.VITE_PUBLIC_API_URL}/newfile`,
          {
            fileNamebyUser: fileName,
            UserPermissions: users
          },
          { withCredentials: true }
        );
        
        // Add new file to local state
        set(state => ({
          data: [...state.data, response.data.newFile]
        }));



        console.log("file nayi",response.data.newFile.fileId)
       window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${response.data.newFile.fileId}`;
        return response.data

         // Refresh data after rename;
      } catch (error) {
        console.error('File creation failed:', error);
        throw error;
      }
    },

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
  const { setIsLoading } = get();
  const { initializeWebSocket, disconnect } = useWebSocketStore.getState();
  const { setfileUrl, fileUrl, setfileUserName } = useAuthStore.getState();

  setIsLoading(true);

  if (fileUrl) {
    setfileUrl(FileLink);
    await disconnect();
    await initializeWebSocket();
  }

  try {
    const { importData } = useSpreadsheetStore.getState();

    // Fetch both file content and file name in one request
    const response = await axios.get(
      `${import.meta.env.VITE_PUBLIC_API_URL}/file/${FileLink}`,
      { withCredentials: true }
    );

    if (response.data.error === "denied") {
      setIsLoading(false);
      return navigate("/permission_denied");
    }

    const { fileNameForUser, fileContent } = response.data;
    console.log("username",fileNameForUser)

    setfileUserName(fileNameForUser);

    if (!fileContent) {
      throw new Error("No data received from the server");
    }

    let rows;
    
    // Check if fileContent is an array (already parsed)
    if (Array.isArray(fileContent)) {
      rows = fileContent;
    } else if (typeof fileContent === "string") {
      rows = fileContent.split("\n").map((row) =>
        row.split(",").map((cell) => cell.replace(/^"|"$/g, ""))
      );
    } else {
      throw new Error("Unexpected file content format");
    }

    importData(rows);
  } catch (error) {
    console.error("Error loading file:", error);
    navigate("/error");
  } finally {
    setIsLoading(false);
  }
},

      
    LoadAdminData: async() =>{
      const res = await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/admin`,
        {withCredentials:true}
      )
      console.log("data => ",res.data.data)
      return res.data.data
      
    },
    // Add to useSpreadsheetStore
AddEmailToFile: async (fileName, email, permission) => {
  try {
    console.log("email to add =>",email)
    await axios.post(
     `${import.meta.env.VITE_PUBLIC_API_URL}/admin/files/${encodeURIComponent(fileName)}/users`,
      { 
        email: email,
        read_permission: permission.includes('Read'),
        write_permission: permission.includes('Write')
      },
      { withCredentials: true }
    );
    return await get().LoadAdminData();
  } catch (error) {
    console.error('Error adding email:', error.message);
    throw error;
  }
},

UpdateUserPermission: async (fileName, email, permission) => {
  console.log(fileName)
  try {
    await axios.put(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin/files/${fileName}/users/${email}`,
      { 
        read_permission: permission.includes('Read'),
        write_permission: permission.includes('Write')
      },
      { withCredentials: true }
    );
    return await get().LoadAdminData();
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
},

 generateToken: async (time, fileName) => {
  try {
    console.log("generate token got hit")
    const response = await axios.post(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin/generateToken`,
      { time, fileName }, // Corrected: Move `time` and `fileName` inside the request body
      { withCredentials: true }
    );
    console.log(time,fileName)
    console.log("token =>",response.data)
    return response.data;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw error;
  }
},
LoadFileByToken: async(fileURL,token,navigate) =>{
  const { importData } = useSpreadsheetStore.getState();

  try {
    const res = await axios.get(
       `${import.meta.env.VITE_PUBLIC_API_URL}/token/file/${fileURL}/${token}
      `)
      console.log("data by res by token =>",res.data)
      const csvText = res.data;  
      if (!csvText) {
        return navigate('/token_expired_or_invalid')
    }


    const rows = csvText.split('\n').map(row =>
        row.split(',').map(cell => cell.replace(/^"|"$/g, ''))
    );

    importData(rows);      
  } catch (error) {
    return navigate('/token_expired_or_invalid')
  }
},// In useSpreadsheetStore actions
deleteFile: async (fileName) => {
  try {
    await axios.delete(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin/files/${encodeURIComponent(fileName)}`,
      { withCredentials: true }
    );
    return await get().LoadAdminData(); // Refresh data
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
},

deleteUserPermission: async (fileName, email) => {
  try {
    await axios.delete(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin/files/${encodeURIComponent(fileName)}/users/${encodeURIComponent(email)}`,
      { withCredentials: true }
    );
    return await get().LoadAdminData(); // Refresh data
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
},
    
    }),
    {
      name: 'spreadsheet-storage',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        localUpdates: new Map(persistedState.localUpdates || []),
        undoStack: persistedState.undoStack || [],
        redoStack: persistedState.redoStack || [],
      })
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

      initializeWebSocket: async() => {
        try {
          const fileUrl = useAuthStore.getState().fileUrl;
          const {setWritePermission,writePermission,user} = useAuthStore.getState()

          // Ensure fileUrl is valid before making a request
          if (!fileUrl && !user) {
            console.log("file url",fileUrl)
            console.warn("No file URL found");

            return;
          }
         
      
          // Check write permission before initializing WebSocket
          const response = await axios.get(
            `${import.meta.env.VITE_PUBLIC_API_URL}/file/${fileUrl}/writeCheck`,
            { withCredentials: true, responseType: 'json' }
          );
          console.log("file url from web socket ",response.data)
      
          if (!response.data.permission) {
            console.warn("User does not have write permission.");
            // return;
          }
          setWritePermission(response.data.permission)
      
          // Initialize WebSocket if permission granted
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
        const {fileUrl,writePermission} = useAuthStore.getState()
        const update = { type: 'UPDATE', row, col, value, id,fileNameFromUser: fileUrl,isWritePermitted: writePermission };
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