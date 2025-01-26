import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useSpreadsheetStore } from '../Store/useStore.js';
import ExcelClone from './ExcelClone.jsx';

export const FileViewer = () => {
  const { fileURL } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { LoadFile } = useSpreadsheetStore();
  const [loading, setLoading] = useState(true);
  var {fileUrl} = useAuthStore()


  useEffect(() => {
    const fetchFile = async () => {
        if (isAuthenticated && fileURL) {
          console.log(fileURL)
            try {
                await LoadFile(fileURL, navigate);
            } catch (error) {
                console.error('Error loading file:', error);
            } finally {
                setLoading(false);
            }
        } else if (!isAuthenticated) {
            navigate('/'); // Redirect if not authenticated
        }
    };

    fetchFile();
}, [isAuthenticated, fileURL, LoadFile, navigate]);

  // if (isLoading || loading) {
  //   return <div>Loading...</div>;
  // }

  // if (!isAuthenticated) {
  //   navigate('/');
  //   return null;
  // }

  return (
<ExcelClone/>
  );
};