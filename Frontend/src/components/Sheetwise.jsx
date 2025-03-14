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
    console.log(theme)
    if (!socket) return;
    
    const handleMessage = async (event) => {
      let update;
      console.log("we got message ->", new Blob([(event.data)]).size)
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
          if (Array.isArray(update) && update.length < 1) {
            console.log("Applying batch updates =>>", update);
          
            const hotInstance = hotTableRef.current?.hotInstance;
            if (!hotInstance) return;
          
            hotInstance.batch(() => {
              update.forEach(({ row, col, value }) => {
                const oldValue = hotInstance.getDataAtCell(row, col);
                if (oldValue !== value) {
                  hotInstance.setDataAtCell(row, col, value, 'apiUpdate');
                }
              });
            });
          }
      
          if (Array.isArray(update)) {
            console.log("Applying async batch updates =>>", update);
          
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
    
    // Parse the input to ensure it's a number
    const numCols = parseInt(colCount, 10);
    if (isNaN(numCols) || numCols <= 0) return;
    
    // Get current column count
    const currentColCount = hotInstance.countCols();
    
    // Add the columns to the table
    hotInstance.alter('insert_col_end', currentColCount - 1, numCols);
    
    console.log(`Added ${numCols} columns. New column count: ${hotInstance.countCols()}`);
    
    // Notify collaborators with the actual number of columns added
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
    
    // Parse the input to ensure it's a number
    const numRows = parseInt(rowCount, 10);
    if (isNaN(numRows) || numRows <= 0) return;
    
    // Get current row count
    const currentRowCount = hotInstance.countRows();
    
    // Add the rows to the table
    hotInstance.alter('insert_row_below', currentRowCount - 1, numRows);
    
    console.log(`Added ${numRows} rows. New row count: ${hotInstance.countRows()}`);
    
    // Notify collaborators with the actual number of rows added
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

  return (
    <div className="flex flex-col">
      {/* Header section with fixed positioning */}
      <div className="flex-none">
        <SpreadsheetHeader hotInstance={hotTableRef.current?.hotInstance} />
      </div>
      
      {/* Main content section with calculated padding-top */}
      <div 
        className="flex-grow relative"
        style={{
          paddingTop: "96px", // Adjust this value based on your header height
          height: "calc(100vh - 120px)", // Ensure the table takes remaining height
          overflow: "visible" 
        }}
      >
        <HotTable
          ref={hotTableRef}
          data={data || MockDataHandsontable}
          width="100%"
          colWidths={150}
          stretchH="all"
          colHeaders={true}        
          rowHeaders={true}
          formulas={{ engine: hyperformulaInstance }} // <-- formulas as a top-level prop
          mergeCells={true}
          columnSorting={true}
          filters={true}
          search={true}
          tabNavigation={true}
          contextMenu={true}
          dropdownMenu={true}
          manualColumnMove={true}
          autoWrapRow={true}
          manualRowResize={true}
          manualColumnResize={true}
          manualRowMove={true}
          className={theme}
          licenseKey="non-commercial-and-evaluation"   
          afterChange={(changes, source) => {
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
          }}
        />
        <div className='w-screen flex justify-center gap-4'>
          <div className="flex items-center">
            <input 
              className='border-2 border-blue-600 w-16 mx-2' 
              type="number" 
              defaultValue={100} 
              min="1"
              onChange={(e) => setRows(e.target.value)} 
            />
            <button
              className='bg-blue-500 p-2 rounded-md text-white hover:bg-blue-600 transition-colors'
              onClick={() => addRows(Rows)}
            >
              Add {Rows} Rows
            </button>
          </div>
          
          <div className="flex items-center">
            <input 
              className='border-2 border-blue-600 w-16 mx-2' 
              type="number" 
              defaultValue={10} 
              min="1"
              onChange={(e) => setCols(e.target.value)} 
            />
            <button
              className='bg-green-500 p-2 rounded-md text-white hover:bg-green-600 transition-colors'
              onClick={() => addColumns(Cols)}
            >
              Add {Cols} Columns
            </button>
          </div>
        </div>
        {isLoading && <LoadingSpinner/>}
        
      </div>
    </div>
  );
};

export default Sheetwise;