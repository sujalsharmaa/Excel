  import React, { useRef, useState, useEffect } from 'react';
  import { Search, Download, Upload, Menu, ChevronDown,Navigation,Plus, Minus, Type  } from 'lucide-react';
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import * as XLSX from "xlsx";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { useAuthStore,useSpreadsheetStore,useWebSocketStore } from '../Store/useStore.js';
  import { useNavigate } from 'react-router-dom';
  import NewFileButton from './NewFileButton.jsx';
  import { AuthGuard } from './AuthGuard.jsx';
  import { UserProfile } from './UserProfile';
  import VisualizationPanel from './VisualizationPanel.jsx';
  import StorageIndicator from './StorageIndicator.jsx';
  import "../../src/index.css"
  import ColumnTypeSelector from './ColumnTypeSelector.jsx';
  import usePreventNavigation from './usePreventPagination.jsx';
  import toast from 'react-hot-toast';
  import ChatFeature from './ChatFeature';
  import VideoCall from './VideoCall.jsx';
  import SpreadsheetAssistant from './SpreadSheetAssistent.jsx';


  const SpreadsheetHeader = ({ hotInstance }) => {
    const { fileUserName, setTheme, theme,fileUrl,isAuthenticated,user,writePermission } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadTarget, setUploadTarget] = useState('import'); // 'import' or 's3'
    const [searchQuery, setSearchQuery] = useState('');
    const [showStorage, setShowStorage] = useState(false);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [selectedCells, setSelectedCells] = useState(null);
    const [isSelectingCells, setIsSelectingCells] = useState(false);
    const {isUploading, setIsUploading} = useSpreadsheetStore();
    const [textColor, setTextColor] = useState('#000000'); // Default black text
    const [Cols, setCols] = useState(1);
    const [Rows, setRows] = useState(10);
    const {socket} = useWebSocketStore()

    usePreventNavigation();
    useEffect(() => {
      if (hotInstance && isSelectingCells) {
        // Add event listener for cell selection
        const onSelectionChange = () => {
          const selected = hotInstance.getSelected();
          if (selected && selected.length > 0) {
            setSelectedCells(selected);
          }
        };
        
        hotInstance.addHook('afterSelectionEnd', onSelectionChange);
        
        return () => {
          hotInstance.removeHook('afterSelectionEnd', onSelectionChange);
        };
      }
    }, [hotInstance, isSelectingCells]);

      // Function to add columns to the table
 const addColumns = (colCount) => {
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
      fileNameFromUser: fileUrl,
      isWritePermitted: writePermission
    }));
  }
};  

// Function to add rows to the table
const addRows = (rowCount) => {
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
      fileNameFromUser: fileUrl,
      isWritePermitted: writePermission
    }));
  }
};

    const handleExportCSV = () => {
      if (!hotInstance) return;
      const exportPlugin = hotInstance.getPlugin('exportFile');
      exportPlugin.downloadFile('csv', {
        filename: `spreadsheet_export_${new Date().toISOString().split('T')[0]}`,
        fileExtension: 'csv',
        mimeType: 'text/csv',
        columnHeaders: true,
        rowHeaders: true,
      });
    };

    // Import CSV and load data into the grid


    const handleImportCSV = async (event) => {
      if (!hotInstance || !event.target.files?.[0]) return;
    
      try {
        const file = event.target.files[0];
        let data = [];
    
        if (file.name.endsWith(".csv")) {
          // Handle CSV file
          const text = await file.text();
          const lines = text.split("\n");
          data = lines.map((line) => line.split(",").map((cell) => cell.trim()));
        } else if (
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          // Handle Excel file
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0]; // Use the first sheet
          const worksheet = workbook.Sheets[sheetName];
    
          // Convert Excel to CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          const lines = csv.split("\n");
          data = lines.map((line) => line.split(",").map((cell) => cell.trim()));
        } else {
          console.error("Unsupported file format");
          return;
        }
    
        // Load data into Handsontable
        hotInstance.loadData(data);
        hotInstance.render();
      } catch (error) {
        console.error("Error importing file:", error);
      }
    };
    
    // Upload the file directly to S3 using a presigned URL
    const {handleUploadToS3AndLoadFile} = useSpreadsheetStore();

    // Use the file input's onChange to decide which action to perform
    const handleFileChange = async (event) => {
      if (uploadTarget === "import") {
        handleImportCSV(event);
      } else if (uploadTarget === "s3") {
        const res = await handleUploadToS3AndLoadFile(event, setUploadProgress);
        console.log("resp by handlechagne",res)
        toast.success(res)
      }
      event.target.value = ""; // Reset input
    };
    

    
    const applyDynamicStyle = (color) => {
      const className = `bg-${color.replace('#', '')}`; // Remove `#` to make a valid class
      if (!document.querySelector(`.${className}`)) {
        const style = document.createElement('style');
        style.innerHTML = `.${className} { background-color: ${color} !important; }`;
        document.head.appendChild(style);
      }
      return className;
    };
    
    
    const applyTextColorStyle = (color) => {
      const className = `text-${color.replace('#', '')}`; // Remove `#` for valid class name
      if (!document.querySelector(`.${className}`)) {
        const style = document.createElement('style');
        style.innerHTML = `.${className} { color: ${color} !important; }`;
        document.head.appendChild(style);
      }
      return className;
    };


    // Example for handling theme change and search…
    const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
      if (!hotInstance) return;
      window.location.reload()
    };

    const handleSearch = (query) => {
      setSearchQuery(query);
      if (hotInstance) {
        const searchPlugin = hotInstance.getPlugin('search');
        searchPlugin.query(query);
        hotInstance.render();
      }
    };

    const [fontSize, setFontSize] = useState(14); // Default font size

    // Replace your cell selection useEffect with this version that just tracks selection changes
    useEffect(() => {
      if (hotInstance) {
        // Add event listener for cell selection
        const onSelectionChange = () => {
          const selected = hotInstance.getSelected();
          if (selected && selected.length > 0) {
            setSelectedCells(selected);
          }
        };
        
        hotInstance.addHook('afterSelectionEnd', onSelectionChange);
        
        return () => {
          hotInstance.removeHook('afterSelectionEnd', onSelectionChange);
        };
      }
    }, [hotInstance]);

            
    
    // Modify the font size styling function
    const applyFontSizeStyle = (size) => {
      const className = `font-size-${size}`;
      if (!document.querySelector(`.${className}`)) {
        const style = document.createElement('style');
        style.innerHTML = `.${className} { font-size: ${size}px !important; }`;
        document.head.appendChild(style);
      }
      return className;
    };
    
    // Update these functions to apply changes immediately
    const handleIncreaseFontSize = () => {
      setFontSize(prev => {
        const newSize = prev + 2;
        applyStyleToSelection(applyFontSizeStyle(newSize), 'font-size');
        return newSize;
      });
    };
    
    const handleDecreaseFontSize = () => {
      setFontSize(prev => {
        const newSize = Math.max(8, prev - 2); // Minimum font size of 8px
        applyStyleToSelection(applyFontSizeStyle(newSize), 'font-size');
        return newSize;
      });
    };
    
    // General function to apply any style to selection
    const applyStyleToSelection = (styleClass, styleType) => {
      if (!hotInstance || !selectedCells) return;
    
      selectedCells.forEach(([startRow, startCol, endRow, endCol]) => {
        for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
          for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
            // Get existing class if any
            const existingClass = hotInstance.getCellMeta(row, col).className || '';
            
            // Remove previous style of same type if it exists
            let baseClass = existingClass;
            if (styleType === 'font-size') {
              baseClass = existingClass.replace(/\bfont-size-\d+\b/g, '').trim();
            } else if (styleType === 'bg-color') {
              baseClass = existingClass.replace(/\bbg-[0-9a-f]+\b/g, '').trim();
            } else if (styleType === 'text-color') {
              baseClass = existingClass.replace(/\btext-[0-9a-f]+\b/g, '').trim();
            }
            
            // Apply new class
            hotInstance.setCellMeta(row, col, 'className', 
              baseClass ? `${baseClass} ${styleClass}` : styleClass);
          }
        }
      });
    
      hotInstance.render();
    };
    
    // Update these color application functions to work directly on selection
    const handleBgColorChange = (color) => {
      setBgColor(color);
      const styleClass = applyDynamicStyle(color);
      applyStyleToSelection(styleClass, 'bg-color');
    };
    
    const handleTextColorChange = (color) => {
      setTextColor(color);
      const styleClass = applyTextColorStyle(color);
      applyStyleToSelection(styleClass, 'text-color');
    };

    return (
      
      <div className="fixed top-0 w-full" style={{ zIndex: 1110 }}>
          
          <div className="py-1 px-4 text-white flex flex-wrap items-center justify-between gap-4 md:gap-6 shadow-md w-full bg-gray-900">
  
  {/* Left Section: Logo & Theme Selector */}
  <div className="flex flex-wrap items-center gap-2">

    { <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-gray-900 text-white w-[185px] rounded-none h-8 focus:outline-none" >
              <img 
      className="w-24 sm:w-32 md:w-40"
      src="/sheetwise-high-resolution-logo.png" 
      alt="Sheetwise Logo"
    />
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                style={{ zIndex: 1200 }}
            className="w-48 bg-white shadow-lg rounded-md border border-gray-200">
             <DropdownMenuItem 
                  onClick={()=>navigate("/contact_us")}
      
                className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploading}
              >
                <Navigation />
                Contact Us
              </DropdownMenuItem>

              <DropdownMenuItem 
                  onClick={()=>navigate("/documentation")}
      
                className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploading}
              >
                <Navigation />
                Documentation
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu> }




    <select 
      name="Themes" 
      className="bg-fuchsia-700 px-3 py-1 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
      value={theme}
      onChange={(e) => handleThemeChange(e.target.value)}
    >
      <option value="ht-theme-main">Light Blue</option>
      <option value="ht-theme-main-dark">Dark Blue</option>
      <option value="ht-theme-horizon">Horizon Light Green</option>
      <option value="ht-theme-horizon-dark">Horizon Dark Yellow</option>
      <option value="no theme">No theme</option>
    </select>

    <ColumnTypeSelector hotInstance={hotInstance} />

  </div>

  {/* Center Section: Color Selection */}


  {/* Right Section: Other Features */}
  <div className="flex flex-wrap items-center gap-3">
  <div className="flex flex-wrap items-center gap-3">

    
    
    {/* Background Color Selection */}
    <div className="flex items-center gap-2">

    <button 
    onClick={handleDecreaseFontSize}
    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-white flex items-center rounded-l-md"
    title="Decrease font size"
    disabled={!selectedCells}
  >
    <Minus className="w-4 h-4" />
  </button>
  
  <div className="px-2 text-white flex items-center bg-gray-700">
    <Type className="w-4 h-4 mr-1" />
    <span className="text-xs whitespace-nowrap">{fontSize}px</span>
  </div>
  
  <button 
    onClick={handleIncreaseFontSize}
    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-white flex items-center rounded-r-md"
    title="Increase font size"
    disabled={!selectedCells}
  >
    <Plus className="w-4 h-4" />
  </button>

  <div className="flex items-center gap-2">
  <input 
    type="color" 
    value={bgColor} 
    onChange={(e) => handleBgColorChange(e.target.value)}
    className="w-8 h-8 rounded cursor-pointer"
    title="Select background color"
    disabled={!selectedCells}
  />
  <span className="text-xs text-white">Bg Color</span>
</div>

{/* Text Color Selection */}
<div className="flex items-center gap-2">
  <input 
    type="color" 
    value={textColor} 
    onChange={(e) => handleTextColorChange(e.target.value)}
    className="w-8 h-8 rounded cursor-pointer"
    title="Select text color"
    disabled={!selectedCells}
  />
  <span className="text-xs text-white">Text Color</span>
</div>

    </div>

    
    
  </div>
    {isAuthenticated && <ChatFeature hotInstance={hotInstance} />}
    {isAuthenticated && <SpreadsheetAssistant hotInstance={hotInstance}/>}
   {/* {isAuthenticated &&  <VideoCall fileNameFromUser={fileUrl} ws={useWebSocketStore.getState().socket} />} */}

{isAuthenticated &&    <button 
      className="px-3 py-1 bg-indigo-700 rounded-lg hover:bg-pink-500 transition"
      onClick={() => navigate("/whiteboard")}
    >
      Whiteboard
    </button>}
    {isAuthenticated && (
      <span className="relative text-sm font-bold border-2 px-2 py-1 rounded-lg overflow-hidden text-black animate-gradient whitespace-pre">
  📋 {fileUserName?.length > 10 ? fileUserName.slice(0, 30) + "..." : fileUserName}
</span>

)}

  </div>

</div>


        <header className="z-[1100] bg-gray-900">
          
    <div className="px-4 relative">
      
      <div className="flex items-center justify-between gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-4">


          {/* Logo */}


          {/* File Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white" >
                <Menu className="w-4 h-4 mr-2" />
                File
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                style={{ zIndex: 1200 }}
            className="w-48 bg-white shadow-lg rounded-md border border-gray-200">
{!isAuthenticated &&               <DropdownMenuItem 
                onClick={() => {
                  setUploadTarget("import");
                  fileInputRef.current?.click();
                }}
            
                className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </DropdownMenuItem>}
{
  isAuthenticated &&                 <DropdownMenuItem 
  onClick={() => {
    setUploadTarget("s3");
    fileInputRef.current?.click();
  }}
  className={`hover:bg-gray-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
  disabled={isUploading}
>
  <Upload className="w-4 h-4 mr-2" />
  Upload to Cloud
</DropdownMenuItem>
}
              <DropdownMenuItem 
                onClick={handleExportCSV}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Panel Button */}
{isAuthenticated && <div className="text-white bg-orange-600 px-2 py-[7px] rounded-md">
            <button
        
            disabled={isUploading} onClick={() => navigate("/admin")}>🔑 Admin Panel</button>
            
          </div>}
          <VisualizationPanel hotInstance={hotInstance}/>
        </div>

        {/* Center Section (Visualization Panel) */}
        <div className="relative z-50">
          {/* Placeholder for VisualizationPanel */}
          
        </div>

<div>
<input 
              className='border-2 border-blue-600 w-16 p-1 text-center mx-2' 
              type="number" 
              defaultValue={10} 
              min="1"
              onChange={(e) => setRows(e.target.value)} 
            />
            <button
              className='bg-blue-500 p-1 rounded-md text-white hover:bg-blue-600 transition-colors md:text-base'
              onClick={() => addRows(Rows)}
            >
              Add {Rows} Rows
            </button>

            <input 
              className='border-2 border-blue-600 w-16 mx-2 p-1 text-center' 
              type="number" 
              defaultValue={1} 
              min="1"
              onChange={(e) => setCols(e.target.value)} 
            />
            <button
              className='bg-green-500 p-1 rounded-md text-white hover:bg-green-600 transition-colors text-sm md:text-base'
              onClick={() => addColumns(Cols)}
            >
              Add {Cols} Columns
            </button>    
</div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search spreadsheet..."
              className="pl-10 w-full sm:w-64 md:w-80 lg:w-44 bg-white rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
            />

          </div>
          {/* Add ChatFeature here */}


          {/* Storage Indicator Button */}
          <div className="relative">
      {isAuthenticated && <Button
              variant="default"
              className="bg-yellow-500 hover:bg-lime-600 text-black"
              onClick={() => setShowStorage(!showStorage)}
              data-storage-indicator
            >
              🛢 Storage
            </Button>}
            {showStorage && (
              <div className="absolute right-0 mt-2">
                {/* StorageIndicator component */}
                <StorageIndicator/>
              </div>
            )}
          </div>

          {/* New File Button */}
          {isAuthenticated && <NewFileButton disabled={isUploading}/>}

          {/* User Profile (AuthGuard) */}
          {!isUploading && <AuthGuard disabled={isUploading}>
            <UserProfile />
          </AuthGuard>}

        </div>
      </div>
    </div>

    {/* File Input */}
    <input
      type="file"
      ref={fileInputRef}
      accept=".csv"
      onChange={handleFileChange}
      className="hidden"
      disabled={isUploading}
    />

    {/* Upload Progress Bar */}
    {uploadProgress > 0 && uploadProgress < 100 && (
      <div className="w-full bg-gray-300 rounded-md mt-2">
        <div
          className="bg-blue-600 text-xs leading-none py-1 text-center text-white rounded-md"
          style={{ width: `${uploadProgress}%` }}
        >
          {uploadProgress}%
        </div>
      </div>
    )}
  </header>

      </div>
      
    );
  }

  export default SpreadsheetHeader;