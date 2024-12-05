import React, { useState, useMemo, useRef } from 'react';

const ExcelClone = () => {
  const ROWS = 20;
  const COLS = 10;

  const [data, setData] = useState(() =>
    Array(ROWS).fill().map(() => Array(COLS).fill(''))
  );
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  // Function to parse and apply formulas dynamically
  const calculateCellValue = (formula, rowOffset, colOffset) => {
    if (!formula?.toString().startsWith('=')) return formula;

    const updatedFormula = formula
      .substring(1)
      .replace(/([A-Z])(\d+)/g, (_, col, row) => {
        const newRow = parseInt(row, 10) + rowOffset;
        const newCol = String.fromCharCode(col.charCodeAt(0) + colOffset);
        return `${newCol}${newRow}`;
      });

    try {
      return `=${updatedFormula}`;
    } catch {
      return '#ERROR';
    }
  };

  const handleMouseDown = (row, col) => {
    setDragStart({ row, col });
    setDragEnd(null);
  };

  const handleMouseOver = (row, col) => {
    if (!dragStart) return;
    setDragEnd({ row, col });
  };

  const handleMouseUp = () => {
    if (dragStart && dragEnd) {
      const startRow = dragStart.row;
      const startCol = dragStart.col;
      const endRow = dragEnd.row;
      const endCol = dragEnd.col;

      const formula = data[startRow][startCol];

      const newData = [...data];
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          if (r !== startRow || c !== startCol) {
            const rowOffset = r - startRow;
            const colOffset = c - startCol;
            newData[r][c] = calculateCellValue(formula, rowOffset, colOffset);
          }
        }
      }

      setData(newData);
    }

    setDragStart(null);
    setDragEnd(null);
  };

  const isDragging = (row, col) => {
    if (!dragStart || !dragEnd) return false;

    const startRow = Math.min(dragStart.row, dragEnd.row);
    const endRow = Math.max(dragStart.row, dragEnd.row);
    const startCol = Math.min(dragStart.col, dragEnd.col);
    const endCol = Math.max(dragStart.col, dragEnd.col);

    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  };

  const handleCellChange = (row, col, value) => {
    const newData = [...data];
    newData[row][col] = value;
    setData(newData);
  };

  return (
    <div className="p-4">
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300"></th>
            {Array(COLS)
              .fill()
              .map((_, i) => (
                <th key={i} className="border border-gray-300 px-2 py-1">
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border border-gray-300 px-2 py-1">{rowIndex + 1}</td>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`border border-gray-300 relative ${
                    isDragging(rowIndex, colIndex) ? 'bg-blue-200' : ''
                  }`}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                  onMouseUp={handleMouseUp}
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    className="w-full px-2 py-1 focus:outline-none"
                  />
                  {dragStart &&
                    dragStart.row === rowIndex &&
                    dragStart.col === colIndex && (
                      <div className="absolute bottom-0 right-0 bg-gray-400 w-2 h-2 cursor-pointer"></div>
                    )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelClone;
