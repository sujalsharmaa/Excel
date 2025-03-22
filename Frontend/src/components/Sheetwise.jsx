import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-horizon.css';
import { HyperFormula } from 'hyperformula';
import { useSpreadsheetStore, useAuthStore, useWebSocketStore } from '@/Store/useStore.js';
import { useRef, useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import * as msgpack from '@msgpack/msgpack';
import SpreadsheetHeader from './SpreadSheetHeader';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/handsontable.css';
import { MockDataHandsontable } from './Mockdata';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate, useParams } from 'react-router-dom';

registerAllModules();

const Sheetwise = () => {
  const { data, LoadFile, setData } = useSpreadsheetStore();
  const { socket } = useWebSocketStore();
  const { user, theme, isLoading, isAuthenticated, setIsLoading, fileUrl, writePermission } = useAuthStore();
  const hotTableRef = useRef(null);
  const batchUpdatesRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const [Rows, setRows] = useState(100);
  const { fileURL } = useParams();
  const navigate = useNavigate();
  const [Cols, setCols] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Detect device type on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Adjust handsontable settings based on screen size
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        if (width < 768) {
          // Mobile settings
          hotInstance.updateSettings({
            colWidths: 100,
            fixedColumnsLeft: 1,
            viewportColumnRenderingOffset: 5,
    //        renderAllRows: false,
            height: height - 200,
          });
        } else if (width >= 768 && width < 1024) {
          // Tablet settings
          hotInstance.updateSettings({
            colWidths: 120,
            fixedColumnsLeft: 2,
            viewportColumnRenderingOffset: 10,
    //        renderAllRows: false,
            height: height - 180,
          });
        } else {
          // Desktop settings
          hotInstance.updateSettings({
            colWidths: 150,
            stretchH: 'all',
            height: '100%',
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchFile = async () => {
      if (isAuthenticated && fileURL) {
        try {
          await LoadFile(fileURL, navigate);
        } catch (error) {
          console.error("❌ Error loading file:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthenticated) {
        navigate('/'); // Redirect if not authenticated
      }
    };

    fetchFile();
  }, [isAuthenticated, fileURL]);

  const sendBatchUpdates = useCallback(
    debounce(() => {
      if (batchUpdatesRef.current.length > 0 && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(batchUpdatesRef.current))
        batchUpdatesRef.current = []; // Clear batch after sending
      }
    }, 10),
    [socket]
  );

  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = async (event) => {
      let update;
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const decodedData = msgpack.decode(new Uint8Array(arrayBuffer));
        update = JSON.parse(decodedData);
      } else {
        update = JSON.parse(event.data);
      }

      switch(update.type){
        case "ROW_ADD":
          const hotInstance = hotTableRef.current?.hotInstance;
          if (!hotInstance) return;
          hotInstance.alter('insert_row_below', update.startRow - 1, update.amount);
          break;

        case "COL_ADD":
          const hotColInstance = hotTableRef.current?.hotInstance;
          if (!hotColInstance) return;
          hotColInstance.alter('insert_col_end', update.startCol - 1, update.amount);
          break;  
        
        default:
          if (Array.isArray(update)) {  
            const hotInstance = hotTableRef.current?.hotInstance;
            if (!hotInstance) return;
          
            requestIdleCallback(() => {
              hotInstance.batch(() => {
                update.forEach(({ row, col, value }) => {
                  const oldValue = hotInstance.getDataAtCell(row, col);
                  if (oldValue !== value) {
                    hotInstance.setDataAtCell(row, col, value, 'apiUpdate');
                  }
                });
              });
            });
          }
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, user?.google_id]);

  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  });

  // Function to add columns to the table
 const addColumns = (colCount) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const numCols = parseInt(colCount, 10);
    if (isNaN(numCols) || numCols <= 0) return;
    
    const currentColCount = hotInstance.countCols();
    hotInstance.alter('insert_col_end', currentColCount - 1, numCols);
    
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'COL_ADD',
        startCol: currentColCount,
        amount: numCols,
        id: user?.google_id,
        fileNameFromUser: fileURL,
        isWritePermitted: writePermission
      }));
    }
  };  

  // Function to add rows to the table
  const addRows = (rowCount) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const numRows = parseInt(rowCount, 10);
    if (isNaN(numRows) || numRows <= 0) return;
    
    const currentRowCount = hotInstance.countRows();
    hotInstance.alter('insert_row_below', currentRowCount - 1, numRows);
    
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'ROW_ADD',
        startRow: currentRowCount,
        amount: numRows,
        id: user?.google_id,
        fileNameFromUser: fileURL,
        isWritePermitted: writePermission
      }));
    }
  };

  // Get table settings based on device
  const getTableSettings = () => {
    const baseSettings = {
      data: data || MockDataHandsontable,
      formulas: { engine: hyperformulaInstance },
      rowHeaders: true,
      colHeaders: true,
      licenseKey: "non-commercial-and-evaluation",
      className: theme,
      contextMenu: !isMobile, // Disable context menu on mobile
      dropdownMenu: !isMobile, // Disable dropdown menu on mobile
      filters: !isMobile, // Simplified on mobile
      manualColumnMove: !isMobile,
      manualRowMove: !isMobile,
      manualColumnResize: true,
      manualRowResize: true,
      mergeCells: true,
      columnSorting: true,
      search: true,
      tabNavigation: true,
      afterChange: (changes, source) => {
        if (!changes || source === 'loadData' || source === 'apiUpdate') return;
    
        const fileKey = `${fileURL}`;
    
        const filteredChanges = changes
          .filter(([row, col, oldVal, newVal]) => oldVal !== newVal)
          .map(([row, col, oldVal, newVal]) => ({
            type: 'UPDATE',
            row,
            col,
            value: newVal,
            id: user?.google_id,
            fileNameFromUser: fileKey,
            isWritePermitted: writePermission
          }));
    
        if (filteredChanges.length === 0) return;
        batchUpdatesRef.current.push(...filteredChanges);
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = setTimeout(sendBatchUpdates);
      }
    };

    if (isMobile) {
      return {
        ...baseSettings,
        width: '100%',
        height: windowSize.height - 200,
        colWidths: 100,
        fixedColumnsLeft: 1,
        fixedRowsTop: 1,
        viewportColumnRenderingOffset: 5,
//        renderAllRows: false,
        autoWrapRow: true,
        stretchH: 'none'
      };
    } else if (isTablet) {
      return {
        ...baseSettings,
        width: '100%',
        height: windowSize.height - 180,
        colWidths: 120,
        fixedColumnsLeft: 1,
        fixedRowsTop: 1,
        viewportColumnRenderingOffset: 10,
//        renderAllRows: false,
        autoWrapRow: true,
        stretchH: 'none'
      };
    } else {
      return {
        ...baseSettings,
        width: '100%',
        height: '100%',
        colWidths: 150,
        stretchH: 'all',
        autoWrapRow: true
      };
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header section */}
      <div className="flex-none">
        <SpreadsheetHeader hotInstance={hotTableRef.current?.hotInstance} />
      </div>
      
      {/* Main content section */}
      <div 
        className="flex-grow relative overflow-hidden"
        style={{
          paddingTop: isMobile ? "64px" : "96px",
          height: isMobile ? `${windowSize.height - 120}px` : "calc(100vh - 120px)"
        }}
      >
        <HotTable
          ref={hotTableRef}
          {...getTableSettings()}
        />
        
        {/* Controls - Responsive layout */}
        <div className={`${isMobile ? 'w-full' : 'w-screen'} flex ${isMobile ? 'flex-col' : 'justify-center'} gap-2 p-2`}>
          <div className={`flex items-center ${isMobile ? 'justify-center mb-2' : ''}`}>
            <input 
              className='border-2 border-blue-600 w-16 mx-2 p-1 text-center' 
              type="number" 
              defaultValue={isMobile ? 20 : 100} 
              min="1"
              onChange={(e) => setRows(e.target.value)} 
            />
            <button
              className='bg-blue-500 p-2 rounded-md text-white hover:bg-blue-600 transition-colors text-sm md:text-base'
              onClick={() => addRows(Rows)}
            >
              Add {Rows} Rows
            </button>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'justify-center' : ''}`}>
            <input 
              className='border-2 border-blue-600 w-16 mx-2 p-1 text-center' 
              type="number" 
              defaultValue={isMobile ? 5 : 10} 
              min="1"
              onChange={(e) => setCols(e.target.value)} 
            />
            <button
              className='bg-green-500 p-2 rounded-md text-white hover:bg-green-600 transition-colors text-sm md:text-base'
              onClick={() => addColumns(Cols)}
            >
              Add {Cols} Columns
            </button>
          </div>
        </div>
        
        {isLoading && <LoadingSpinner/>}
        
        {/* Mobile guidance tooltip */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-blue-100 p-3 text-center text-sm border-t border-blue-300">
            <p>Tip: Swipe to navigate, pinch to zoom. Tap and hold for cell editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sheetwise;