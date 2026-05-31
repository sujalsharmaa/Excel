import React, { useRef, useState, useEffect } from 'react';
import { Search, Download, Upload, Menu, ChevronDown, Navigation, Plus, Minus, Type } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useSpreadsheetStore, useWebSocketStore } from '../Store/useStore.js';
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
  const { fileUserName, setTheme, theme, fileUrl, isAuthenticated, user, writePermission } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState('import'); // 'import' or 's3'
  const [searchQuery, setSearchQuery] = useState('');
  const [showStorage, setShowStorage] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedCells, setSelectedCells] = useState(null);
  const [isSelectingCells, setIsSelectingCells] = useState(false);
  const { isUploading, setIsUploading } = useSpreadsheetStore();
  const [textColor, setTextColor] = useState('#000000'); // Default black text
  const [Cols, setCols] = useState(1);
  const [Rows, setRows] = useState(10);
  const { socket } = useWebSocketStore();
  const [fontSize, setFontSize] = useState(14); // Default font size

  usePreventNavigation();

  useEffect(() => {
    if (hotInstance) {
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
      filename: `spreadsheet_export_${new Date().toISOString().split('T')}`,
      fileExtension: 'csv',
      mimeType: 'text/csv',
      columnHeaders: true,
      rowHeaders: true,
    });
  };

  const handleImportCSV = async (event) => {
    if (!hotInstance) return;
    try {
      const file = event.target.files;
      let data = [];

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const lines = text.split("\n");
        data = lines.map((line) => line.split(",").map((cell) => cell.trim()));
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames;
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const lines = csv.split("\n");
        data = lines.map((line) => line.split(",").map((cell) => cell.trim()));
      } else {
        console.error("Unsupported file format");
        return;
      }
      hotInstance.loadData(data);
      hotInstance.render();
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  const { handleUploadToS3AndLoadFile } = useSpreadsheetStore();

  const handleFileChange = async (event) => {
    if (uploadTarget === "import") {
      handleImportCSV(event);
    } else if (uploadTarget === "s3") {
      const res = await handleUploadToS3AndLoadFile(event, setUploadProgress);
      toast.success(res);
    }
    event.target.value = "";
  };

  const applyDynamicStyle = (color) => {
    const className = `bg-${color.replace('#', '')}`;
    if (!document.querySelector(`.${className}`)) {
      const style = document.createElement('style');
      style.innerHTML = `.${className} { background-color: ${color} !important; }`;
      document.head.appendChild(style);
    }
    return className;
  };

  const applyTextColorStyle = (color) => {
    const className = `text-${color.replace('#', '')}`;
    if (!document.querySelector(`.${className}`)) {
      const style = document.createElement('style');
      style.innerHTML = `.${className} { color: ${color} !important; }`;
      document.head.appendChild(style);
    }
    return className;
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (!hotInstance) return;
    window.location.reload();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (hotInstance) {
      const searchPlugin = hotInstance.getPlugin('search');
      searchPlugin.query(query);
      hotInstance.render();
    }
  };

  const applyFontSizeStyle = (size) => {
    const className = `font-size-${size}`;
    if (!document.querySelector(`.${className}`)) {
      const style = document.createElement('style');
      style.innerHTML = `.${className} { font-size: ${size}px !important; }`;
      document.head.appendChild(style);
    }
    return className;
  };

  const handleIncreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = prev + 2;
      applyStyleToSelection(applyFontSizeStyle(newSize), 'font-size');
      return newSize;
    });
  };

  const handleDecreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(8, prev - 2);
      applyStyleToSelection(applyFontSizeStyle(newSize), 'font-size');
      return newSize;
    });
  };

  const applyStyleToSelection = (styleClass, styleType) => {
    if (!hotInstance || !selectedCells) return;
    selectedCells.forEach(([startRow, startCol, endRow, endCol]) => {
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
        for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
          const existingClass = hotInstance.getCellMeta(row, col).className || '';
          let baseClass = existingClass;
          if (styleType === 'font-size') {
            baseClass = existingClass.replace(/\bfont-size-\d+\b/g, '').trim();
          } else if (styleType === 'bg-color') {
            baseClass = existingClass.replace(/\bbg-[0-9a-f]+\b/g, '').trim();
          } else if (styleType === 'text-color') {
            baseClass = existingClass.replace(/\btext-[0-9a-f]+\b/g, '').trim();
          }
          hotInstance.setCellMeta(row, col, 'className', baseClass ? `${baseClass} ${styleClass}` : styleClass);
        }
      }
    });
    hotInstance.render();
  };

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
    <div className="fixed top-0 w-full shadow-lg" style={{ zIndex: 1110 }}>
      {/* --- TOP TOOLBAR --- */}
      <div className="py-2 px-2 md:px-4 text-white flex items-center justify-between gap-4 w-full bg-gray-900 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Left Section: Logo & Theme Selector */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-gray-900 text-white w-auto px-2 md:w-[185px] rounded-none h-8 focus:outline-none shrink-0" >
                <img
                  className="w-20 sm:w-24 md:w-32 object-contain"
                  src="/sheetwise-high-resolution-logo.png"
                  alt="Sheetwise Logo"
                />
                <ChevronDown className="w-4 h-4 ml-1 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{ zIndex: 1200 }} className="w-48 bg-white shadow-lg rounded-md border border-gray-200">
              <DropdownMenuItem
                onClick={() => navigate("/contact_us")}
                className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploading}
              >
                <Navigation className="mr-2 w-4 h-4" />
                Contact Us
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/documentation")}
                className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isUploading}
              >
                <Navigation className="mr-2 w-4 h-4" />
                Documentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <select
            name="Themes"
            className="bg-fuchsia-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 flex-shrink-0 outline-none"
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            <option value="ht-theme-main">Light Blue</option>
            <option value="ht-theme-main-dark">Dark Blue</option>
            <option value="ht-theme-horizon">Horizon Light</option>
            <option value="ht-theme-horizon-dark">Horizon Dark</option>
            <option value="no theme">No theme</option>
          </select>

          <div className="flex-shrink-0">
            <ColumnTypeSelector hotInstance={hotInstance} />
          </div>
        </div>

        {/* Right Section: Tools */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Font Size Controls */}
            <div className="flex items-center rounded-md overflow-hidden border border-gray-600 flex-shrink-0">
              <button
                onClick={handleDecreaseFontSize}
                className="bg-gray-700 hover:bg-gray-600 px-1.5 sm:px-2 py-1 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Decrease font size"
                disabled={!selectedCells}
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="px-1.5 sm:px-2 py-1 text-white flex items-center gap-1 bg-gray-800 select-none">
                <Type className="w-3 h-3 text-gray-400 hidden sm:block" />
                <span className="text-xs font-medium tabular-nums w-6 sm:w-7 text-center">{fontSize}</span>
              </div>
              <button
                onClick={handleIncreaseFontSize}
                className="bg-gray-700 hover:bg-gray-600 px-1.5 sm:px-2 py-1 text-white flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Increase font size"
                disabled={!selectedCells}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Background Color */}
            <label className={`flex items-center gap-1 bg-gray-700 hover:bg-gray-600 transition-colors px-1.5 sm:px-2 py-1 rounded-md cursor-pointer border border-gray-600 flex-shrink-0 ${!selectedCells ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`} title="Select background color">
              <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-gray-500 flex-shrink-0" style={{ backgroundColor: bgColor }} />
              <input type="color" value={bgColor} onChange={(e) => handleBgColorChange(e.target.value)} className="sr-only" disabled={!selectedCells} />
              <span className="text-xs text-gray-200 hidden sm:block">Bg</span>
            </label>

            {/* Text Color */}
            <label className={`flex items-center gap-1 bg-gray-700 hover:bg-gray-600 transition-colors px-1.5 sm:px-2 py-1 rounded-md cursor-pointer border border-gray-600 flex-shrink-0 ${!selectedCells ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`} title="Select text color">
              <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-gray-500 flex-shrink-0" style={{ backgroundColor: textColor }} />
              <input type="color" value={textColor} onChange={(e) => handleTextColorChange(e.target.value)} className="sr-only" disabled={!selectedCells} />
              <span className="text-xs text-gray-200 hidden sm:block">Text</span>
            </label>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* {isAuthenticated && <ChatFeature hotInstance={hotInstance} />} */}
            {isAuthenticated && <SpreadsheetAssistant hotInstance={hotInstance} />}
            
            {isAuthenticated && (
              <button
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-indigo-700 rounded-lg hover:bg-pink-500 transition whitespace-nowrap"
                onClick={() => navigate("/whiteboard")}
              >
                Whiteboard
              </button>
            )}
            
            {isAuthenticated && (
              <span className="text-xs sm:text-sm font-bold border-2 px-2 py-1 rounded-lg overflow-hidden text-black animate-gradient whitespace-nowrap max-w-[120px] sm:max-w-[200px] truncate">
                📋 {fileUserName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM TOOLBAR --- */}
      <header className="z- bg-gray-800 border-t border-gray-700">
        <div className="px-2 md:px-4 py-2 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="flex items-center justify-between gap-4 min-w-max">
            
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm h-8">
                    <Menu className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    File
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ zIndex: 1200 }} className="w-48 bg-white shadow-lg rounded-md border border-gray-200">
                  {!isAuthenticated && (
                    <DropdownMenuItem
                      onClick={() => { setUploadTarget("import"); fileInputRef.current?.click(); }}
                      className={`hover:bg-red-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Import CSV
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (
                    <DropdownMenuItem
                      onClick={() => { setUploadTarget("s3"); fileInputRef.current?.click(); }}
                      className={`hover:bg-gray-100 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Upload to Cloud
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleExportCSV} className="hover:bg-gray-100 cursor-pointer">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAuthenticated && (
                <button
                  disabled={isUploading}
                  onClick={() => navigate("/admin")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap h-8 flex items-center"
                >
                  🔑 Admin
                </button>
              )}
              
              <div className="flex-shrink-0">
                <VisualizationPanel hotInstance={hotInstance} />
              </div>
            </div>

            {/* Center Section (Row/Col Adders) */}
            <div className="flex items-center gap-2 flex-shrink-0 bg-gray-900 px-2 py-1 rounded-md">
              <div className="flex items-center">
                <input
                  className='border border-blue-600 bg-gray-800 text-white w-10 sm:w-12 h-7 p-1 text-center text-xs sm:text-sm rounded-l focus:outline-none'
                  type="number"
                  defaultValue={10}
                  min="1"
                  onChange={(e) => setRows(e.target.value)}
                />
                <button
                  className='bg-blue-600 h-7 px-2 text-white hover:bg-blue-500 transition-colors text-xs sm:text-sm rounded-r whitespace-nowrap'
                  onClick={() => addRows(Rows)}
                >
                  + Rows
                </button>
              </div>

              <div className="w-px h-5 bg-gray-600 mx-1 hidden sm:block"></div>

              <div className="flex items-center">
                <input
                  className='border border-green-600 bg-gray-800 text-white w-10 sm:w-12 h-7 p-1 text-center text-xs sm:text-sm rounded-l focus:outline-none'
                  type="number"
                  defaultValue={1}
                  min="1"
                  onChange={(e) => setCols(e.target.value)}
                />
                <button
                  className='bg-green-600 h-7 px-2 text-white hover:bg-green-500 transition-colors text-xs sm:text-sm rounded-r whitespace-nowrap'
                  onClick={() => addColumns(Cols)}
                >
                  + Cols
                </button>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 h-8 w-28 sm:w-40 md:w-56 bg-gray-900 border-gray-600 text-white text-xs sm:text-sm rounded-md focus:ring-1 focus:ring-green-500 focus:outline-none transition-all"
                />
              </div>

              <div className="relative flex-shrink-0">
                {isAuthenticated && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-yellow-500 hover:bg-lime-600 text-black text-xs sm:text-sm h-8 px-2 sm:px-3"
                    onClick={() => setShowStorage(!showStorage)}
                    data-storage-indicator
                  >
                    🛢 <span className="hidden sm:inline ml-1">Storage</span>
                  </Button>
                )}

              </div>

              <div className="flex-shrink-0">
                {isAuthenticated && <NewFileButton disabled={isUploading} />}
              </div>

              <div className="flex-shrink-0">
                {!isUploading && (
                  <AuthGuard disabled={isUploading}>
                    <UserProfile />
                  </AuthGuard>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Hidden Inputs / Progress bars */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-300">
            <div
              className="bg-blue-600 text-[10px] leading-none py-0.5 text-center text-white"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
      </header>

      {showStorage && (
        <div className="absolute right-32 top-[85px] sm:top-[110px] z- bg-white shadow-xl rounded-md border border-gray-200">
          <StorageIndicator />
        </div>
      )}
      {isAuthenticated && (
        <div className="absolute top-[9px] right-[520px]">
          <ChatFeature hotInstance={hotInstance} />
        </div>
      )}
      

    </div>
  );
}

export default SpreadsheetHeader;