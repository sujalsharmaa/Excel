import React, { useState, useCallback, useRef } from 'react';
import { useSpreadsheetStore } from '../Store/useStore.js';
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

const ExcelClone = () => {
  const { ROWS, COLS, data, setCellValue, importData } = useSpreadsheetStore();
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [calculatedCells, setCalculatedCells] = useState(new Set());
  const [selectedData, setSelectedData] = useState([]);
  const [graphType, setGraphType] = useState(null);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
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

  // Text formatting handlers (keep existing)

  // Cell selection logic (keep existing)
  // Handlers for text formatting, alignment, font, and zoom
  const handleTextFormat = (formatType) => {
    setTextFormat(prev => ({
      ...prev,
      [formatType]: !prev[formatType]
    }));
  };

  const handleTextAlignment = (alignment) => {
    setTextAlignment(alignment);
  };

  const handleFontChange = (font) => {
    setFontFamily(font);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  const handleZoom = (zoomPercentage) => {
    setZoomLevel(zoomPercentage);
  };

  const getColumnName = (index) => String.fromCharCode(65 + index);

  // Cell Selection and Drag Logic
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

  // Formula Calculation Logic with Formula.js
  const getCellValue = (cellRef) => {
    const match = cellRef.match(/([A-Z])(\d+)/);
    if (!match) return null;

    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2]) - 1;

    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      return null;
    }

    return parseFloat(data[row][col]) || 0;
  };


  // Enhanced formula handling
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

  // Enhanced cell value calculation with circular reference check
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

  // Rest of the component (keep existing handlers, UI, etc.)
  // ... (keep all existing handlers, JSX, and other logic)

 // Handle Cell Change
 const handleChange = (row, col, value) => {
  setCellValue(row, col, value);

  const cellKey = `${row}-${col}`;
  if (calculatedCells.has(cellKey)) {
    const newCalculatedCells = new Set(calculatedCells);
    newCalculatedCells.delete(cellKey);
    setCalculatedCells(newCalculatedCells);
  }
};

// Handle Key Down (e.g., Enter key)
const handleKeyDown = (e, row, col) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const currentValue = data[row][col];
    if (currentValue.toString().startsWith('=')) {
      const result = calculateCellValue(currentValue);
      handleChange(row, col, result);

      const cellKey = `${row}-${col}`;
      const newCalculatedCells = new Set(calculatedCells);
      newCalculatedCells.add(cellKey);
      setCalculatedCells(newCalculatedCells);
    }
    if (row < ROWS - 1) {
      setSelectedCell({ row: row + 1, col });
      const nextInput = document.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  }
};

// Data Import/Export Logic
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

    const newROWS = rows.length;
    const newCOLS = Math.max(...rows.map(row => row.length));

    importData(rows);
    setCalculatedCells(new Set());
  };
  reader.readAsText(file);
};

// Graphing Logic
const handleDataSelection = () => {
  if (selectedCells.length === 0) return;

  const selectedValues = selectedCells.map(({ row, col }) => ({
    name: `Row ${row + 1} Col ${getColumnName(col)}`,
    value: parseFloat(data[row][col]) || 0,
  }));

  setSelectedData(selectedValues);
  setIsGraphModalOpen(true);
};

const exportGraphToPNG = () => {
  if (!graphRef.current) return;
  toPng(graphRef.current, { cacheBust: true })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'graph.png';
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => console.error('Failed to export graph:', err));
};

const renderGraph = () => {
  if (selectedData.length === 0) {
    return <div className="text-center text-red-500">No valid numeric data for visualization</div>;
  }

  switch (graphType) {
    case 'bar':
      return (
        <div ref={graphRef}>
          <BarChart width={600} height={400} data={selectedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0088FE" />
          </BarChart>
        </div>
      );
    case 'pie':
      return (
        <div ref={graphRef}>
          <RechartsPieChart width={600} height={450}>
            <Pie
              data={selectedData}
              cx={300}
              cy={200}
              outerRadius={150}
              dataKey="value"
            >
              {selectedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </div>
      );
    case 'line':
      return (
        <div ref={graphRef}>
          <LineChart width={600} height={400} data={selectedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884D8" />
          </LineChart>
        </div>
      );
    default:
      return <div className="text-center text-red-500">Select a valid graph type</div>;
  }
};

return (
  <div className="">
    <header>
      <Headers
        handleDataSelection={handleDataSelection}
        exportToCSV={exportToCSV}
        fileInputRef={fileInputRef}
        importCSV={importCSV}
        setGraphType={setGraphType}
        onTextFormat={handleTextFormat}
        onTextAlignment={handleTextAlignment}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        onZoom={handleZoom}
      />
    </header>

    {/* Graph Modal */}
    {isGraphModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-4xl w-full relative">
          <button
            onClick={() => setIsGraphModalOpen(false)}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-4">Create Visualization</h2>
          {renderGraph()}
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

    {/* Spreadsheet Table */}
    <div className="table-container" onMouseUp={handleMouseUp}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="w-12 bg-gray-200"></th>
            {Array(COLS).fill().map((_, i) => (
              <th key={i} className="bg-gray-200 px-2 py-1 text-center">
                {getColumnName(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array(ROWS).fill().map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="bg-gray-100 border-black text-center border-r">{rowIndex + 1}</td>
              {Array(COLS).fill().map((_, colIndex) => {
                const isSelectedRange = isSelected(rowIndex, colIndex);
                return (
                  <td
                    key={colIndex}
                    className={`border relative ${
                      isSelectedRange ? `border-[3px] border-black` : 'border-black'
                    }`}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                  >
                    <input
                      type="text"
                      value={data[rowIndex][colIndex] || ''}
                      onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      className={`w-full px-2 py-1 focus:outline-none ${
                        textFormat.bold ? 'font-bold' : ''
                      } ${
                        textFormat.italic ? 'italic' : ''
                      } ${
                        textFormat.underline ? 'underline' : ''
                      }`}
                      style={{
                        textAlign: textAlignment,
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'center center'
                      }}
                      placeholder=""
                    />
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