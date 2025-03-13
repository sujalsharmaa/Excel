// StorageIndicator.jsx
import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useSpreadsheetStore } from '../Store/useStore';
import { useNavigate } from 'react-router-dom';


const StorageIndicator = () => {
    const navigate = useNavigate()
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { LoadUserStorage } = useSpreadsheetStore();
  
  const loadStorage = async () => {
    try {
      setLoading(true);
      const res = await LoadUserStorage();
      setStorageData(res);
      setError(null);
    } catch (err) {
      setError('Failed to load storage data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const totalStorageGB = 1;
  const usedGB = storageData?.gigabytes || 0;
  const percentage = (usedGB / totalStorageGB) * 100;
  const remainingGB = totalStorageGB - usedGB;

  return (
    <div className="absolute top-full right-0 mt-2 p-4 bg-white rounded-lg shadow-md w-80 z-50">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20">
          <CircularProgressbar
            value={percentage}
            text={`${Math.round(percentage)}%`}
            styles={buildStyles({
              pathColor: percentage > 90 ? '#dc2626' : '#10b981',
              textColor: '#1f2937',
              trailColor: '#e5e7eb'
            })}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Storage</h3>
          <p className="text-sm text-gray-600">
            {usedGB.toFixed(2)} GB of {totalStorageGB} GB used
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {remainingGB.toFixed(2)} GB remaining
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Need more space?
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Upgrade to Premium and get up to 10 GB storage
        </p>
        <button
          className="w-full bg-yellow-500 hover:bg-lime-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          onClick={() => navigate('/upgradeStorage')}
        >
          Upgrade Storage - $2.99/month
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Loading storage data...
        </div>
      )}
    </div>
  );
};

export default StorageIndicator;