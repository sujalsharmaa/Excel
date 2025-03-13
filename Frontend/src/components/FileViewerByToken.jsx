import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpreadsheetStore,useAuthStore } from '../Store/useStore.js';
import ExcelClone from './Sheetwise.jsx';

export const FileViewerbyToken = () => {
  const { FILEURL,token } = useParams();
  const navigate = useNavigate();
  const {setToken,setIsLoading} = useAuthStore()
  const { LoadFileByToken } = useSpreadsheetStore();
 

  useEffect(() => {
    const fetchFile = async () => {
        if (token && FILEURL) {
            try {
                setToken(token)
                await LoadFileByToken(FILEURL,token,navigate);
            } catch (error) {
                console.log('Error loading file:',error.message);
            } finally {
              setIsLoading(false);
            }

    };
    }
    fetchFile();
}, [FILEURL,token]);



  return (
<ExcelClone/>
  );
};