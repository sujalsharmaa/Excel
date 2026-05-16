import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpreadsheetStore,useAuthStore } from '../Store/useStore.js';
import ExcelClone from './Sheetwise.jsx';

export const FileViewerbyToken = () => {
  const { FILEURL,token } = useParams();
  const navigate = useNavigate();
  const {setFileToken,setIsLoading} = useAuthStore()
  const { LoadFileByToken } = useSpreadsheetStore();
 
console.log(FILEURL,token)
  useEffect(() => {
    const fetchFile = async () => {
        if (token && FILEURL) {
            try {
                setFileToken(token)
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