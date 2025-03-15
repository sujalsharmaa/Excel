import { create } from 'zustand';
import axios from 'axios';
import { persist } from 'zustand/middleware';
import Papa from "papaparse";
import { MockDataHandsontable } from '@/components/Mockdata';


// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      theme: "ht-theme-main-dark",
      Token: null,
      setToken: (token) => set({Token: token}),
      setTheme: (themes) => set({ theme: themes }),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      writePermission: false,
      setWritePermission: (permission) => set({writePermission: permission}),
      error: null,
      fileUrl: null,
      fileUserName: null,
      setfileUserName: (name) => set({ fileUserName: name }),
      setfileUrl: (url) => set({ fileUrl: url }),

      // Initialize Google Auth when needed
      initGoogleAuth: async () => {
        return new Promise((resolve) => {
          // Check if script is already loaded
          if (document.getElementById('google-signin-script')) {
            if (window.google && window.google.accounts) {
              resolve();
              return;
            }
          }
          
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.id = 'google-signin-script';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            // Make sure to explicitly use the environment variable
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

            if (!clientId) {
              console.error("Client ID is missing in environment variables");
              set({ error: 'Google Client ID is not configured' });
              resolve();
              return;
            }
            
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: (response) => {
                get().handleGoogleLogin(response.credential);
              },
              auto_select: false
            });
            resolve();
          };
          document.body.appendChild(script);
        });
      },

      // Render Google sign-in button
      renderGoogleButton: (elementId) => {
        if (!window.google || !window.google.accounts) {
          console.error("Google accounts library not loaded yet");
          return;
        }
        
        const element = document.getElementById(elementId);
        if (!element) {
          console.error(`Element with ID ${elementId} not found`);
          return;
        }
        
        window.google.accounts.id.renderButton(element, { 
          theme: 'filled_blue', 
          size: 'large', 
          width: '100%', 
          text: 'signin_with' 
        });
      },

      // Handle Google login with tokeninfo endpoint
      handleGoogleLogin: async (idToken) => {
        const { setIsLoading } = get();
        try {
          setIsLoading(true);
          
          // Send token to backend for verification and session creation
          const response = await axios.post(
            `${import.meta.env.VITE_PUBLIC_API_URL}/auth/google/verify`,
            { token: idToken },
            { withCredentials: true }
          );
          
          if (response.data.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              fileUrl: response.data.LastModifiedFileId,
              error: null
            });
            
            // Redirect to file if available
            if (response.data.LastModifiedFileId && 
                !window.location.href.includes(`/file/${response.data.LastModifiedFileId}`)) {
                  console.log("hello from redirection logic")
              window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${response.data.LastModifiedFileId}`;
            }
          }
        } catch (error) {
          console.error("Google login error:", error);
          set({ error: error.response?.data?.error || 'Authentication failed' });
        } finally {
          setIsLoading(false);
        }
      },

      // For backward compatibility, maintain the redirect method
      // but also add the new Google Sign-In prompt method
      login: async () => {
        try {
          // Try the new method first
          await get().initGoogleAuth();
          if (window.google && window.google.accounts) {
            window.google.accounts.id.prompt();
            return;
          }
          
          // Fall back to the old redirect method if Google Sign-In fails
          
          // window.location.href = `${import.meta.env.VITE_PUBLIC_API_URL}/auth/google`;
        } catch (error) {
          console.error("Login initialization error:", error);
          // Fall back to the old redirect method
          window.location.href = `${import.meta.env.VITE_PUBLIC_API_URL}/auth/google`;
        }
      },

      // Rest of the methods remain the same
      logout: async () => {
        const {disconnect} = useWebSocketStore.getState();
        const {setIsLoading} = get();
        const { setData } = useSpreadsheetStore.getState();
        try {
          setIsLoading(true);
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            fileUrl: null,
            fileUserName: null,
          });
  
          await disconnect();

          await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/logout`, {
            withCredentials: true
          });
          
          // Sign out from Google as well
          if (window.google && window.google.accounts) {
            window.google.accounts.id.disableAutoSelect();
          }
          window.location.reload()
        } catch (error) {
          set({ error: 'Failed to logout' });
        } finally {
          setData(MockDataHandsontable);
          setIsLoading(false);
        }
      },

      checkAuth: async () => {
        const {user, fileUrl} = useAuthStore.getState();
        if (user && fileUrl) {
          console.log("checkAuth");
          return;
        }
        try {
          set({ isLoading: true });
          const response = await axios.get(
            `${import.meta.env.VITE_PUBLIC_API_URL}/auth/status`,
            {withCredentials: true}
          );
    
          if (response.data.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              error: null,
              fileUrl: response.data.LastModifiedFileId,
            });

            setTimeout(() => {
              if (response.data.LastModifiedFileId && !window.location.href.includes(`/file/${response.data.LastModifiedFileId}`)) {
                window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${response.data.LastModifiedFileId}`;
                return;
              }
            }, 10);
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
        theme: state.theme
      })
    }
  )
);


// Improved spreadsheet store with local-first updates
export const useSpreadsheetStore = create(
  persist(
    (set, get) => ({
   
      data: null,
      hotTableRef: null,
      setHotTableRef: (ref) => set({ hotTableRef: ref }),
      setData: (data) => set({ data }),
      isUploading: false,
      setIsUploading: (state) => set({ isUploading: state}),
      EmailArray: [],
      setEmailArray: (emails) => set({ EmailArray: emails }),

          // In useSpreadsheetStore
      renameFile: async (fileId, newFileName) => {
      try {

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
          const response = await axios.post(
            `${import.meta.env.VITE_PUBLIC_API_URL}/newfile`,
            {
              fileNamebyUser: fileName,
              UserPermissions: users
            },
            { withCredentials: true }
          );
      
          console.log("File created successfully:");
      
          // Redirect to the new file page
          window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${response.data.fileId}`;
      
          return response.data;
        } catch (error) {
          let errorMessage = "An unexpected error occurred.";
      
          if (error.response) {
            errorMessage = error.response.data?.error || "Server error occurred.";
          } else if (error.request) {
            errorMessage = "No response from the server. Please try again.";
          } else {
            errorMessage = error.message;
          }
      
          console.error("File creation failed:", errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      

      resetData: () => {
        set({
          data: Array(get().ROWS).fill().map(() => Array(get().COLS).fill('')),
          localUpdates: new Map()
        });
      },

      // Add a selector to get data as a 2D array for rendering
      getDataArray: () => {
        const { matrix, ROWS, COLS } = get();
        return matrix.exportToArray(ROWS, COLS);
      },

       // Import compression library
       LoadFile: async (FileLink, navigate) => {
        const { initializeWebSocket, disconnect } = useWebSocketStore.getState();
        const { setfileUrl, fileUrl, setfileUserName, setIsLoading,Token } = useAuthStore.getState();
        const { setData } = get();
    
        setIsLoading(true)
        try {
            if (fileUrl !== FileLink) { 
                setfileUrl(FileLink);
                await disconnect();
                await initializeWebSocket();
            }
    
            // 🔹 Fetch from server if not in cache
            const response = await axios.get(
                `${import.meta.env.VITE_PUBLIC_API_URL}/file/${FileLink}`,
                { withCredentials: true }
            );


    
            if (response.data.error === "denied") {
                setIsLoading(false);
                return navigate("/permission_denied");
            }
    
            const { fileNameForUser, fileContent } = response.data;
            setfileUserName(fileNameForUser);
    
            if (!fileContent) throw new Error("No data received from the server");
    
            setData(fileContent);
        } catch (error) {
            console.error("❌ Error loading file:", error);
            navigate("/error");
        } finally {
            setIsLoading(false);
        }
    },
    
    

    handleUploadToS3AndLoadFile: async (event, setUploadProgress) => {
      if (!event.target.files?.[0]) return;
    
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("fileType", file.type);
      formData.append("fileSize", file.size);
    
      const { setIsUploading } = get();
      const { setIsLoading } = useAuthStore.getState();
    
      try {
        setIsUploading(true);
        setIsLoading(true);
    
        const response = await axios.post(
          `${import.meta.env.VITE_PUBLIC_API_URL}/uploadToS3AndLoadFile`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          }
        );
    
        setTimeout(() => {
          window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/file/${response.data.fileName}`;
        }, 500);
      } catch (err) {
        console.error("Error uploading file:", err);
        setIsLoading(false);
        return err.response?.data?.error || "Error uploading file";
      } finally {
        setIsUploading(false);
        setIsLoading(false);
      }
    },
    


sendEmailFileLink: async(email,file_id,fileName) =>{
  const { setIsLoading } = useAuthStore.getState()
  
  setIsLoading(true);
  const res = await axios.post(
    `${import.meta.env.VITE_PUBLIC_API_URL}/email`,
    { email,file_id,fileName},
    { withCredentials: true }
  );
  if (res){
    setIsLoading(false);
  }
},

LoadUserStorage: async() =>{
  const res = await axios.get(`${import.meta.env.VITE_PUBLIC_API_URL}/storageSize`,
    {withCredentials:true}
  )
  return res.data
},

      
LoadAdminData: async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin`,
      { withCredentials: true }
    );

    const emailSet = new Set();
    res.data.data.forEach((file) => {
      file.permissions.forEach((obj) => emailSet.add(obj.email));
    });

    get().setEmailArray(Array.from(emailSet)); // Convert Set to array and update state

    console.log("Admin data loaded:");
    return res.data.data;
  } catch (error) {
    console.error("Error loading admin data:", error);
    return null;
  }
},
    // Add to useSpreadsheetStore
AddEmailToFile: async (fileName, email, permission) => {
  try {
    const res = await axios.post(
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
 
    const response = await axios.post(
      `${import.meta.env.VITE_PUBLIC_API_URL}/admin/generateToken`,
      { time, fileName }, // Corrected: Move `time` and `fileName` inside the request body
      { withCredentials: true }
    );
    console.log(time,fileName)
    return response.data;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw error;
  }
},
LoadFileByToken: async (fileURL, token, navigate) => {
  const { setIsLoading,setWritePermission } = useAuthStore.getState();
  const { setData } = get();


  try {
    setIsLoading(true);
    setWritePermission(false)
    const res = await axios.get(
      `${import.meta.env.VITE_PUBLIC_API_URL}/token/file/${fileURL}/${token}`
    );

    const { fileContent, ttl } = res.data;

    if (!fileContent) {
      console.log("filecontent is not available")
      return navigate("/token_expired_or_invalid");
    }

    let rows;
      
    if (Array.isArray(fileContent)) {
      rows = fileContent;
    } else if (typeof fileContent === "string") {
      // Use PapaParse for fast CSV parsing
      const parsed = Papa.parse(fileContent, {
        skipEmptyLines: true,
        dynamicTyping: true, // Auto-convert numbers
      });
      rows = parsed.data;
    } else {
      throw new Error("Unexpected file content format");
    }

    setData(rows);
    setIsLoading(false);

    // Reload data before token expires
    const timeToRefresh = ttl > 5 ? ttl - 5 : 1; // Refresh 5 sec before expiration
    console.log(`Refreshing in ${timeToRefresh} seconds...`);

    // **Schedule navigation after timeToRefresh seconds**
    setTimeout(() => {
      navigate("/token_expired_or_invalid");
      
    }, timeToRefresh * 1000);
    
  } catch (error) {
    console.error("Error loading file:", error);
    navigate("/token_expired_or_invalid");
  }
},

// In useSpreadsheetStore actions
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

  )
);

// Improved WebSocket store with better update handling
export const useWebSocketStore = create(

    (set, get) => ({
      socket: null,
      isConnected: false,
      connectionError: null,
      pendingUpdates: [],

      initializeWebSocket: async() => {
        try {
          const fileUrl = useAuthStore.getState().fileUrl;
          const {setWritePermission} = useAuthStore.getState()
      
          // Ensure fileUrl is valid before making a request
          if (fileUrl==="token") {
            console.warn("No file URL found");
            return;
          }
         
      
          // Check write permission before initializing WebSocket
          const response = await axios.get(
            `${import.meta.env.VITE_PUBLIC_API_URL}/file/${fileUrl}/writeCheck`,
            { withCredentials: true, responseType: "json", timeout: 5000 }
          );
      
          if (!response.data.permission) {
            console.warn("User does not have write permission.");
          }
          setWritePermission(response.data.permission)
      
          // Initialize WebSocket if permission granted
          const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws`);


          ws.onopen = () => {
            console.warn("i have set socket to ws")
            set({
              socket: ws,
              isConnected: true,
              connectionError: null,
            });
  
            const {isAuthenticated,fileUrl,user} = useAuthStore.getState()
            if (isAuthenticated && fileUrl) {
              ws.send(JSON.stringify({
                type: 'INIT',
                userID: user.google_id,
                fileName: fileUrl
              }))
            }
            return
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
            console.log(error)
          };

        } catch (error) {
          set({
            connectionError: 'Failed to initialize WebSocket connection',
            isConnected: false,
          });
        }
      },


      disconnect: async() => {
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
  )



