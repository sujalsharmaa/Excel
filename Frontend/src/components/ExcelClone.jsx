import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSpreadsheetStore } from '../Store/useStore';
import Headers from './Headers';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { toPng } from 'html-to-image';
import * as formulajs from 'formulajs';


const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#FF5733', '#C70039', '#900C3F', '#DAF7A6', '#FFC300',
  '#581845', '#7DCEA0', '#1ABC9C', '#3498DB', '#9B59B6',
  '#E74C3C', '#2ECC71', '#F1C40F', '#7F8C8D', '#34495E',
  '#A569BD', '#D35400', '#BDC3C7', '#27AE60', '#16A085',
];



// Function metadata for suggestions
const FUNCTION_SIGNATURES = {
  SUM: 'SUM(number1, [number2], ...)',
  AVERAGE: 'AVERAGE(number1, [number2], ...)',
  VLOOKUP: 'VLOOKUP(lookup_value, table_array, col_index, [range_lookup])',
  IF: 'IF(logical_test, value_if_true, value_if_false)',
  COUNT: 'COUNT(value1, [value2], ...)',
  MAX: 'MAX(number1, [number2], ...)',
  MIN: 'MIN(number1, [number2], ...)',
  ROUND: 'ROUND(number, num_digits)',
  CONCATENATE: 'CONCATENATE(text1, [text2], ...)',
  TODAY: 'TODAY()',
  NOW: 'NOW()',
  AND: 'AND(logical1, [logical2], ...)',
  OR: 'OR(logical1, [logical2], ...)',
  TEXT: 'TEXT(value, format_text)',
  DATE: 'DATE(year, month, day)',
  PMT: 'PMT(rate, nper, pv, [fv], [type])',
};

const ExcelClone = () => {
  const { ROWS, COLS, data, setCellValue, importData } = useSpreadsheetStore();
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [calculatedCells, setCalculatedCells] = useState(new Set());
  const [selectedData, setSelectedData] = useState([]);
  const [graphType, setGraphType] = useState(null);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const undo = useSpreadsheetStore((state) => state.undo);
  const redo = useSpreadsheetStore((state) => state.redo);

// Add this useEffect for keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }
  };

  // Add event listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Cleanup function to remove listener
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [undo, redo]); // Add undo and redo as dependencies
  

  
useEffect(() => {
  if (editingCell) {
    const input = document.querySelector(
      `input[data-row="${editingCell.row}"][data-col="${editingCell.col}"]`
    );
    input?.focus();
    input?.select();
  }
}, [editingCell]);

  const graphRef = useRef(null);
  const fileInputRef = useRef(null);
  const [textFormat, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [textAlignment, setTextAlignment] = useState('left');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Formula suggestions state
  const [showFormulaSuggestions, setShowFormulaSuggestions] = useState(false);
  const [formulaPrefix, setFormulaPrefix] = useState('');
  const [suggestedFunctions, setSuggestedFunctions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 });
  const activeInputRef = useRef(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [touchStartCell, setTouchStartCell] = useState(null);

  const getLastSelectedCell = () => {
    if (!selectedCells.length) return null;
    return selectedCells.reduce((last, current) => {
      if (current.row >= last.row && current.col >= last.col) {
        return current;
      }
      return last;
    });
  };

  // Function to get the first selected cell (top-left)
  const getFirstSelectedCell = () => {
    if (!selectedCells.length) return null;
    return selectedCells.reduce((first, current) => {
      if (current.row <= first.row && current.col <= first.col) {
        return current;
      }
      return first;
    });
  };

  // Handle touch events for drag handle
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDraggingHandle(true);
    setTouchStartCell(selectedCell);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingHandle) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element?.tagName === 'INPUT') {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      
      if (!isNaN(row) && !isNaN(col)) {
        const startCell = touchStartCell || selectedCell;
        
        // Calculate selection area
        const startRow = Math.min(startCell.row, row);
        const endRow = Math.max(startCell.row, row);
        const startCol = Math.min(startCell.col, col);
        const endCol = Math.max(startCell.col, col);

        // Create new selection
        const newSelection = [];
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            newSelection.push({ row: r, col: c });
          }
        }
        setSelectedCells(newSelection);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingHandle(false);
    setTouchStartCell(null);
  };

  // Add touch event listeners
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (isDraggingHandle) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDraggingHandle) {
        handleTouchEnd();
      }
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDraggingHandle, touchStartCell]);
  // Combined function list
  const allFunctions = [
    ...Object.keys(formulajs).filter(k => typeof formulajs[k] === 'function'),
    ...Object.keys(FUNCTION_SIGNATURES)
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Formula suggestion handlers
  const handleFormulaInput = (e, row, col) => {
    const value = e.target.value;
    handleChange(row, col, value);
    
    if (value.startsWith('=')) {
      const input = value.slice(1);
      const caretPosition = e.target.selectionStart;
      const currentWord = input.substring(0, caretPosition).split(/[^a-zA-Z]/).pop();
      
      setFormulaPrefix(currentWord.toUpperCase());
      setShowFormulaSuggestions(true);
      setSelectedSuggestionIndex(0);
      
      if (activeInputRef.current) {
        const rect = activeInputRef.current.getBoundingClientRect();
        setDropdownPosition({
          left: rect.left + window.scrollX,
          top: rect.bottom + window.scrollY
        });
      }
    } else {
      setShowFormulaSuggestions(false);
    }
  };

  const handleFormulaKeyDown = (e, row, col) => {
    if (showFormulaSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            Math.min(prev + 1, suggestedFunctions.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestedFunctions.length > 0) {
            selectSuggestion(suggestedFunctions[selectedSuggestionIndex], row, col);
          }
          break;
        case 'Escape':
          setShowFormulaSuggestions(false);
          break;
      }
    }
  };

  const selectSuggestion = (fnName, row, col) => {
    const currentValue = data[row][col];
    const newValue = `=${fnName}(${currentValue.slice(1 + formulaPrefix.length)})`;
    
    handleChange(row, col, newValue);
    setShowFormulaSuggestions(false);
    
    setTimeout(() => {
      const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
      if (input) {
        input.focus();
        input.setSelectionRange(fnName.length + 2, fnName.length + 2);
      }
    }, 0);
  };

  useEffect(() => {
    if (formulaPrefix) {
      const filtered = allFunctions.filter(fn =>
        fn.startsWith(formulaPrefix.toUpperCase())
      ).sort();
      setSuggestedFunctions(filtered);
    }
  }, [formulaPrefix]);

  // Existing spreadsheet logic
  const getColumnName = (index) => String.fromCharCode(65 + index);

  const handleMouseDown = (row, col) => {
    setDragStart({ row, col });
    setSelectedCells([{ row, col }]);
    setSelectedCell({ row, col });
  };

  const handleMouseOver = (row, col) => {
    if (!dragStart) return;

    const startRow = Math.min(dragStart.row, row);
    const endRow = Math.max(dragStart.row, row);
    const startCol = Math.min(dragStart.col, col);
    const endCol = Math.max(dragStart.col, col);

    const newSelection = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        newSelection.push({ row: r, col: c });
      }
    }
    setSelectedCells(newSelection);
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const isSelected = (row, col) =>
    selectedCells.some((cell) => cell.row === row && cell.col === col);

  // Formula calculation logic
  const processRange = (range) => {
    const [start, end] = range.split(':');
    const startMatch = start.match(/([A-Z]+)(\d+)/i);
    const endMatch = end.match(/([A-Z]+)(\d+)/i);

    if (!startMatch || !endMatch) return [];

    const startCol = startMatch[1].toUpperCase();
    const startRow = parseInt(startMatch[2]) - 1;
    const endCol = endMatch[1].toUpperCase();
    const endRow = parseInt(endMatch[2]) - 1;

    const colStart = startCol.charCodeAt(0) - 65;
    const colEnd = endCol.charCodeAt(0) - 65;

    const rangeData = [];
    for (let row = startRow; row <= endRow; row++) {
      const rowData = [];
      for (let col = colStart; col <= colEnd; col++) {
        const value = data[row]?.[col] || '';
        rowData.push(isNaN(value) ? value : parseFloat(value));
      }
      rangeData.push(rowData);
    }
    return rangeData;
  };

  const evaluateFormula = (formula, data) => {
    try {
      let evaluatedFormula = formula
      .replace(/\bTRUE\b/gi, 'true')
      .replace(/\bFALSE\b/gi, 'false')
      .replace(/([A-Z]+\d+):([A-Z]+\d+)/gi, (match, start, end) => {
        const values = processRange(`${start}:${end}`);
        return JSON.stringify(values);
      })
      .replace(/([A-Z]+)(\d+)/gi, (match, col, row) => {
        const colIndex = col.toUpperCase().charCodeAt(0) - 65;
        const rowIndex = parseInt(row) - 1;
        const value = data[rowIndex]?.[colIndex] || 0;
        return isNaN(value) ? `"${value}"` : value;
      });

      // Extract formula.js functions
      const {
        // Math
        SUM, AVERAGE, MAX, MIN, COUNT, ROUND, ABS, SQRT, MOD, POWER, PRODUCT, SUMPRODUCT,
        SUMIF, SUMIFS, RAND, RANDBETWEEN, CEILING, FLOOR, EXP, LOG, LOG10, LN,
        
        // Text
        CONCATENATE, LEFT, RIGHT, MID, LEN, LOWER, UPPER, PROPER, TRIM, SUBSTITUTE,
        REPLACE, TEXT, SEARCH, FIND, VALUE, REPT,
        
        // Date
        TODAY, NOW, DATE, DAY, MONTH, YEAR, HOUR, MINUTE, SECOND, EDATE, EOMONTH,
        DATEDIF, WEEKDAY, WEEKNUM,
        
        // Financial
        PMT, PV, FV, RATE, NPV, IRR, XIRR, DB, SLN, DDB,
        
        // Statistical
        STDEV, STDEVP, VAR, VARP, CORREL, MEDIAN, MODE, PERCENTILE, QUARTILE, RANK
      } = formulajs;

      // Custom functions
      const customFunctions = {
        // Logical
        IF: (condition, trueVal, falseVal) => condition ? trueVal : falseVal,
        AND: (...args) => args.every(Boolean),
        OR: (...args) => args.some(Boolean),
        NOT: (arg) => !arg,
        XOR: (...args) => args.filter(Boolean).length % 2 !== 0,
        IFERROR: (value, valueIfError) => {
          try { return value; } catch { return valueIfError; }
        },
        ISERROR: (value) => value instanceof Error,
        ISBLANK: (value) => value === '' || value === null || value === undefined,
        ISNUMBER: (value) => typeof value === 'number' && !isNaN(value),
        ISTEXT: (value) => typeof value === 'string',

        // Lookup
        VLOOKUP: (lookupValue, tableArray, colIndex, [rangeLookup]) => {
          const table = JSON.parse(tableArray);
          for (let row of table) {
            if (row[0] == lookupValue) return row[colIndex - 1];
          }
          return '#N/A';
        },

        // Text
        TEXTJOIN: (delimiter, ignoreEmpty, ...texts) => {
          const parts = texts.flat().filter(t => ignoreEmpty ? t !== '' : true);
          return parts.join(delimiter);
        },

        // Statistical
        COUNTIF: (range, criteria) => {
          const values = JSON.parse(range).flat();
          return values.filter(v => eval(`v ${criteria}`)).length;
        }
      };

      // Combine all functions
      const allFunctions = {
        ...customFunctions,
        SUM, AVERAGE, MAX, MIN, COUNT, ROUND, ABS, SQRT, MOD, POWER, PRODUCT, SUMPRODUCT,
        SUMIF, SUMIFS, RAND, RANDBETWEEN, CEILING, FLOOR, EXP, LOG, LOG10, LN,
        CONCATENATE, LEFT, RIGHT, MID, LEN, LOWER, UPPER, PROPER, TRIM, SUBSTITUTE,
        REPLACE, TEXT, SEARCH, FIND, VALUE, REPT, TODAY, NOW, DATE, DAY, MONTH, YEAR,
        HOUR, MINUTE, SECOND, EDATE, EOMONTH, DATEDIF, WEEKDAY, WEEKNUM, PMT, PV, FV,
        RATE, NPV, IRR, XIRR, DB, SLN, DDB, STDEV, STDEVP, VAR, VARP, CORREL, MEDIAN,
        MODE, PERCENTILE, QUARTILE, RANK
      };

      // Evaluate formula with all functions
      return eval(
        `((${Object.keys(allFunctions).join(',')}) => (${evaluatedFormula}))`
      )(...Object.values(allFunctions));
    } catch (error) {
      console.error('Formula error:', error);
      return `#ERROR: ${error.message.split(':')[0]}`;
    }
  };

  const calculateCellValue = useCallback((value, visitedCells = new Set()) => {
    if (!value?.toString().startsWith('=')) return value;

    const cellKey = `${selectedCell?.row}-${selectedCell?.col}`;
    if (visitedCells.has(cellKey)) return '#CIRCULAR';
    visitedCells.add(cellKey);

    try {
      const formula = value.substring(1).toUpperCase();
      const result = evaluateFormula(formula, data);
      visitedCells.delete(cellKey);
      return result;
    } catch (error) {
      visitedCells.delete(cellKey);
      return '#ERROR';
    }
  }, [data, selectedCell]);

  // Cell value handlers
  const handleChange = (row, col, value) => {
    setCellValue(row, col, value);
    const cellKey = `${row}-${col}`;
    if (calculatedCells.has(cellKey)) {
      setCalculatedCells(new Set([...calculatedCells].filter(k => k !== cellKey)));
    }
  };

  const handleKeyDown = (e, row, col) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = data[row][col];
      if (currentValue?.toString().startsWith('=')) {
        const result = calculateCellValue(currentValue);
        handleChange(row, col, result);
        setCalculatedCells(new Set([...calculatedCells, `${row}-${col}`]));
      }
      setEditingCell(null);
      setShowFormulaSuggestions(false); // Add this line
      if (row < ROWS - 1) {
        setSelectedCell({ row: row + 1, col });
        const nextInput = document.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`);
        nextInput?.focus();
      }
    }
  };

  // Data import/export
  const exportToCSV = () => {
    const csvContent = data
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'spreadsheet.csv';
    link.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const rows = csvText.split('\n').map(row =>
        row.split(',').map(cell => cell.replace(/^"|"$/g, ''))
      );
      importData(rows);
      setCalculatedCells(new Set());
    };
    reader.readAsText(file);
  };

  // Charting functionality
  const handleDataSelection = () => {
    const selectedValues = selectedCells.map(({ row, col }) => ({
      name: `Row ${row + 1} Col ${getColumnName(col)}`,
      value: parseFloat(data[row][col]) || 0,
    }));
    setSelectedData(selectedValues);
    setIsGraphModalOpen(true);
  };

  const exportGraphToPNG = () => {
    toPng(graphRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = dataUrl;
        link.click();
      })
      .catch(console.error);
  };

  const renderGraph = () => {
    if (!selectedData.length) return <div className="text-red-500">No data selected</div>;

    switch (graphType) {
      case 'bar':
        return (
          <BarChart width={600} height={400} data={selectedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0088FE" />
          </BarChart>
        );
      case 'pie':
        return (
          <RechartsPieChart width={600} height={450}>
            <Pie data={selectedData} cx={300} cy={200} outerRadius={150} dataKey="value">
              {selectedData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        );
      case 'line':
        return (
          <LineChart width={600} height={400} data={selectedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884D8" />
          </LineChart>
        );
      default:
        return <div className="text-red-500">Select a graph type</div>;
    }
  };

  // Formula suggestions UI
  const renderFormulaSuggestions = () => (
    showFormulaSuggestions && (
      <div 
        className="absolute z-50 bg-white border border-gray-300 shadow-lg rounded-md max-h-60 overflow-y-auto"
        style={{ 
          left: `${dropdownPosition.left}px`,
          top: `${dropdownPosition.top}px`,
          minWidth: '300px'
        }}
      >
        {suggestedFunctions.map((fn, i) => (
          <div
            key={fn}
            className={`p-2 hover:bg-blue-50 cursor-pointer ${i === selectedSuggestionIndex ? '' : ''}`}
            onClick={() => selectSuggestion(fn, selectedCell.row, selectedCell.col)}
          >
            <div className="font-mono text-blue-600">{fn}</div>
            <div className="text-gray-500 text-sm">
              {FUNCTION_SIGNATURES[fn] || 'Custom function'}
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className="relative">
      {renderFormulaSuggestions()}
      
      <header>
        <Headers
          handleDataSelection={handleDataSelection}
          exportToCSV={exportToCSV}
          fileInputRef={fileInputRef}
          importCSV={importCSV}
          setGraphType={setGraphType}
          onTextFormat={(format) => setTextFormat(prev => ({ ...prev, [format]: !prev[format] }))}
          onTextAlignment={setTextAlignment}
          onFontChange={setFontFamily}
          onFontSizeChange={setFontSize}
          onZoom={setZoomLevel}
          textFormat={textFormat}
          currentAlignment={textAlignment}
          currentFont={fontFamily}
          currentFontSize={fontSize}
          zoomLevel={zoomLevel}
        />
      </header>

      {isGraphModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full relative">
            <button
              onClick={() => setIsGraphModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Data Visualization</h2>
            <div ref={graphRef}>{renderGraph()}</div>
            <div className="flex justify-center mt-4">
              <button
                onClick={exportGraphToPNG}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Download size={16} />
                Export Graph
              </button>
            </div>
          </div>
        </div>
      )}

      

      <div className="overflow-auto" onMouseUp={handleMouseUp}>
        <table className="border-collapse" style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: '0 0' }}>
          <thead>
            <tr>
              <th className="w-12 bg-gray-200 border-black border-2"></th>
              {Array(COLS).fill().map((_, i) => (
                <th key={i} className="bg-gray-200 px-2 py-1 border-2 border-black text-center">
                  {getColumnName(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(ROWS).fill().map((_, row) => (
              <tr key={row}>
                <td className="bg-gray-100 text-center border-2 border-r-black border-b-black">
                  {row + 1}
                </td>
                {Array(COLS).fill().map((_, col) => {
                  const isSelectedCell = isSelected(row, col);
                  const lastSelectedCell = getLastSelectedCell();
                  const showDragHandle = lastSelectedCell?.row === row && lastSelectedCell?.col === col;
                  
                  return (
                    <td
                      key={col}
                      className={`border relative ${
                        isSelectedCell ? 'border-2 border-black bg-[#7CB9E8]' : 'border-black'
                      }`}
                      onMouseDown={() => handleMouseDown(row, col)}
                      onMouseOver={() => handleMouseOver(row, col)}
                      onDoubleClick={() => setEditingCell({ row, col })}
                    >
                      <input
                        type="text"
                        value={data[row][col] || ''}
                        readOnly={!(editingCell?.row === row && editingCell?.col === col)}
                        onChange={(e) => handleFormulaInput(e, row, col)}
                        onBlur={() => {
                          setEditingCell(null);
                          setShowFormulaSuggestions(false);
                        }}
                        onKeyDown={(e) => {
                          handleKeyDown(e, row, col);
                          handleFormulaKeyDown(e, row, col);
                        }}
                        className={`w-full h-full px-2 focus:outline-none ${
                          textFormat.bold ? 'font-bold' : ''
                        } ${textFormat.italic ? 'italic' : ''} ${
                          textFormat.underline ? 'underline' : ''
                        }`}
                        style={{
                          textAlign: textAlignment,
                          fontSize: `${fontSize}px`,
                          fontFamily: fontFamily,
                          backgroundColor: isSelectedCell ? '#7CB9E8' : 'white'
                        }}
                        data-row={row}
                        data-col={col}
                        ref={el => {
                          if (isSelectedCell) activeInputRef.current = el;
                        }}
                      />
                      {showDragHandle && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 rounded-full cursor-se-resize touch-none"
                          onTouchStart={handleTouchStart}
                          style={{
                            transform: 'translate(50%, 50%)',
                            zIndex: 10
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcelClone;