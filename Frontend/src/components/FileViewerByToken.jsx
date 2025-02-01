import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpreadsheetStore } from '../Store/useStore.js';
import ExcelClone from './ExcelClone.jsx';

export const FileViewerbyToken = () => {
  const { fileURL,token } = useParams();
  const navigate = useNavigate();

  const { LoadFileByToken } = useSpreadsheetStore();
  const [loading, setLoading] = useState(true);
 


  useEffect(() => {
    const fetchFile = async () => {
        if (token && fileURL) {
            try {
                await LoadFileByToken(fileURL,token,navigate);
            } catch (error) {
                //navigate('/token_expired_or_invalid')
                console.log('Error loading file:',error.message);
            } finally {
                setLoading(false);
            }

    };
    }
    fetchFile();
}, [fileURL,token]);



  return (
<ExcelClone/>
  );
};