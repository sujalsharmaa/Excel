import React, { useState, useCallback, useRef } from 'react';
import { useSpreadsheetStore } from '../Store/useStore.js'; // Import the Zustand store
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
import * as formulajs from 'formulajs'; // Import Formula.js

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#FF5733', '#C70039', '#900C3F', '#DAF7A6', '#FFC300',
  '#581845', '#7DCEA0', '#1ABC9C', '#3498DB', '#9B59B6',
  '#E74C3C', '#2ECC71', '#F1C40F', '#7F8C8D', '#34495E',
  '#A569BD', '#D35400', '#BDC3C7', '#27AE60', '#16A085',
];

const ExcelClone = () => {
  // Use Zustand store for spreadsheet data
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

  const processRange = (range) => {
    const [start, end] = range.split(':');
    if (!start || !end) return [];

    const startMatch = start.match(/([A-Z])(\d+)/);
    const endMatch = end.match(/([A-Z])(\d+)/);

    if (!startMatch || !endMatch) return [];

    const startCol = startMatch[1].charCodeAt(0) - 65;
    const startRow = parseInt(startMatch[2]) - 1;
    const endCol = endMatch[1].charCodeAt(0) - 65;
    const endRow = parseInt(endMatch[2]) - 1;

    const values = [];
    for (let i = Math.min(startRow, endRow); i <= Math.max(startRow, endRow); i++) {
      for (let j = Math.min(startCol, endCol); j <= Math.max(startCol, endCol); j++) {
        if (i >= 0 && i < ROWS && j >= 0 && j < COLS) {
          const value = parseFloat(data[i][j]);
          if (!isNaN(value)) {
            values.push(value);
          }
        }
      }
    }
    return values;
  };

  const evaluateFormula = (formula, data) => {
    // Step 1: Replace ranges like A1:A3 with comma-separated values
    let evaluatedFormula = formula.replace(/([A-Z]+\d+):([A-Z]+\d+)/g, (match, start, end) => {
      const range = `${start}:${end}`;
      const values = processRange(range);
      return values.join(',');
    });
  
    // Step 2: Replace individual cell references like A1 with their values
    evaluatedFormula = evaluatedFormula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
      const colIndex = col.charCodeAt(0) - 65;
      const rowIndex = parseInt(row) - 1;
      const value = data[rowIndex]?.[colIndex];
      // Ensure numeric values, non-numeric treated as 0
      return isNaN(value) ? 0 : parseFloat(value);
    });
  
    try {
      // Define formulajs functions for use in eval
      const SUM = (...args) => formulajs.SUM(...args);
      const AVERAGE = (...args) => formulajs.AVERAGE(...args);
      const MAX = (...args) => formulajs.MAX(...args);
      const MIN = (...args) => formulajs.MIN(...args);
      // Add other functions as needed (e.g., MULTIPLY, DIVIDE, etc.)
  
      // Evaluate the formula string with access to the defined functions
      const result = eval(evaluatedFormula);
      return result;
    } catch (error) {
      console.error('Evaluation error:', error);
      throw new Error('Formula evaluation failed');
    }
  };
  
  const calculateCellValue = useCallback((value, visitedCells = new Set()) => {
    if (!value?.toString().startsWith('=')) return value;
  
    const formula = value.substring(1).toUpperCase();
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
  
    if (visitedCells.has(cellKey)) {
      console.error('Circular reference detected:', cellKey);
      return '#CIRCULAR';
    }
  
    visitedCells.add(cellKey);
  
    try {
      const result = evaluateFormula(formula, data);
      visitedCells.delete(cellKey);
      return result;
    } catch (error) {
      console.error('Formula error:', error);
      return '#ERROR';
    }
  }, [data, selectedCell]);
  
  

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