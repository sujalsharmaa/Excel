import React, { useState, useCallback, useRef } from 'react';
import { Download, Table, Upload } from 'lucide-react';

const ExcelClone = () => {
  const ROWS = 1000;
  const COLS = 10;

  const [selectedCell, setSelectedCell] = useState(null);
  const [data, setData] = useState(() => {
    const initial = Array(ROWS).fill().map(() => Array(COLS).fill(''));
    return initial;
  });
  const [formattedCells, setFormattedCells] = useState(new Set());
  const [calculatedCells, setCalculatedCells] = useState(new Set());

  const getColumnName = (index) => String.fromCharCode(65 + index);

  const handleCellSelect = (row, col) => {
    setSelectedCell({ row, col });
  };

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

  const calculateCellValue = useCallback((value) => {
    if (!value?.toString().startsWith('=')) return value;

    const formula = value.substring(1).toUpperCase();
    
    try {
      if (formula.startsWith('SUM(') || formula.startsWith('AVG(')) {
        const isAvg = formula.startsWith('AVG');
        const content = formula.slice(4, -1);
        
        let values = [];
        
        const parts = content.split('+');
        
        parts.forEach(part => {
          part = part.trim();
          if (part.includes(':')) {
            values = [...values, ...processRange(part)];
          } else {
            const cellValue = getCellValue(part);
            if (cellValue !== null) {
              values.push(cellValue);
            }
          }
        });
        
        if (values.length === 0) {
          return '#ERROR: No valid numbers';
        }
        
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        
        if (isAvg) {
          return (sum / values.length).toFixed(2);
        }
        return sum.toFixed(2);
      }
      return '#ERROR: Unknown formula';
    } catch (error) {
      return '#ERROR: Invalid formula';
    }
  }, [data]);

  const handleCellChange = (row, col, value) => {
    const newData = [...data];
    newData[row][col] = value;
    setData(newData);
    
    const cellKey = `${row}-${col}`;
    if (calculatedCells.has(cellKey)) {
      const newCalculatedCells = new Set(calculatedCells);
      newCalculatedCells.delete(cellKey);
      setCalculatedCells(newCalculatedCells);
    }
  };

  const handleKeyDown = (e, row, col) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = data[row][col];
      if (currentValue.toString().startsWith('=')) {
        const result = calculateCellValue(currentValue);
        handleCellChange(row, col, result);
        
        const cellKey = `${row}-${col}`;
        const newCalculatedCells = new Set(calculatedCells);
        newCalculatedCells.add(cellKey);
        setCalculatedCells(newCalculatedCells);
      }
      if (row < ROWS - 1) {
        handleCellSelect(row + 1, col);
        const nextInput = document.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

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
        row.split(',').map(cell => 
          cell.replace(/^"|"$/g, '') // Remove surrounding quotes
        )
      );

      const importedData = Array(ROWS).fill().map((_, rowIndex) => 
        Array(COLS).fill('').map((_, colIndex) => 
          rows[rowIndex] && rows[rowIndex][colIndex] ? rows[rowIndex][colIndex] : ''
        )
      );

      setData(importedData);
      setFormattedCells(new Set());
      setCalculatedCells(new Set());
    };
    reader.readAsText(file);
  };

  const formatSelectedCell = () => {
    if (!selectedCell) return;
    const newFormattedCells = new Set(formattedCells);
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    if (formattedCells.has(cellKey)) {
      newFormattedCells.delete(cellKey);
    } else {
      newFormattedCells.add(cellKey);
    }
    setFormattedCells(newFormattedCells);
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <div className="mb-4 flex gap-2">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download size={16} />
          Export CSV
        </button>
        <button
          onClick={formatSelectedCell}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Table size={16} />
          Format Cell
        </button>
        <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
          <Upload size={16} />
          Import CSV
          <input 
            type="file" 
            accept=".csv" 
            onChange={importCSV} 
            className="hidden" 
          />
        </label>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-700 to-blue-600 text-white rounded hover:bg-indigo-600"
        >
          Made in INDORE
        </button>
      </div>

      <div className="inline-block min-w-full border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="w-12 bg-gray-100"></th>
              {Array(COLS).fill().map((_, i) => (
                <th key={i} className="w-24 bg-gray-100 px-2 py-1 text-center">
                  {getColumnName(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="bg-gray-100 text-center border-r">{rowIndex + 1}</td>
                {row.map((cell, colIndex) => {
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isFormatted = formattedCells.has(`${rowIndex}-${colIndex}`);
                  
                  return (
                    <td
                      key={colIndex}
                      className={`border relative ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      } ${
                        isFormatted ? 'bg-gray-50 font-medium' : ''
                      }`}
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        onClick={() => handleCellSelect(rowIndex, colIndex)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        data-row={rowIndex}
                        data-col={colIndex}
                        className="w-full px-2 py-1 focus:outline-none"
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