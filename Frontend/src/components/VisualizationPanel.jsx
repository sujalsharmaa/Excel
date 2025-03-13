import React, { useState, useEffect } from 'react';
import { 
  BarChart2,
  X,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedCharts from './EnhancedCharts';

const VisualizationPanel = ({ hotInstance }) => {
  const [showCharts, setShowCharts] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [currentSelection, setCurrentSelection] = useState(null);

  useEffect(() => {
    if (!hotInstance) return;
  
    const updateSelection = (row, column, row2, column2) => {
      const selection = {
        startRow: Math.min(row, row2),
        endRow: Math.max(row, row2),
        startCol: Math.min(column, column2),
        endCol: Math.max(column, column2)
      };
      setCurrentSelection(selection);
    };
  
    hotInstance.addHook('afterSelection', updateSelection);
    return () => hotInstance.removeHook('afterSelection', updateSelection);
  }, [hotInstance]);



const generateChartData = () => {
  if (!hotInstance || !currentSelection) {
    alert("Please select a range of data first");
    return;
  }

  const { startRow, endRow, startCol, endCol } = currentSelection;
  try {
    const data = [];
    const headers = [];

    // Check if first row contains headers
    const firstRow = hotInstance.getDataAtRow(startRow);
    const hasHeaders = firstRow
      .slice(startCol, endCol + 1)
      .some((cell) => typeof cell === "string" && isNaN(cell));

    // Extract headers
    if (hasHeaders) {
      for (let col = startCol; col <= endCol; col++) {
        headers.push(
          hotInstance.getDataAtCell(startRow, col) || `Column ${col + 1}`
        );
      }
      startRow++;
    }

    // Extract data rows
    for (let row = startRow; row <= endRow; row++) {
      const rowData = {};
      let hasValidNumber = false; // Track if there's at least one valid number

      for (let col = startCol; col <= endCol; col++) {
        const header = headers[col - startCol] || `Column ${col - startCol + 1}`;
        let cellValue = hotInstance.getDataAtCell(row, col);

        if (!isNaN(cellValue) && cellValue !== null && cellValue !== "") {
          rowData[header] = Number(cellValue);
          hasValidNumber = true; // Mark row as valid
        }
      }

      if (hasValidNumber) {
        data.push(rowData);
      }
    }

    setChartData(data);
    setShowCharts(true);
  } catch (error) {
    console.error("Error generating chart data:", error);
    alert("Error generating chart. Please check your data selection.");
  }
};


  return (
    <>
      <div className="p-2 flex items-center gap-5">
        <Button
          onClick={generateChartData}
          className="flex items-center gap-2 text-white bg-blue-600"
        >
          <BarChart2 className="w-4 h-4" />
          Generate Chart
        </Button>
      </div>

          {/* Floating Chart Modal */}
    {showCharts && chartData.length > 0 && (
      <div className="fixed top-0 h-screeen left-1/2 transform -translate-x-1/2 w-3/4 bg-white shadow-lg rounded-lg p-4 z-50 overflow-y-auto">
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowCharts(false)}
            className="absolute top-2 right-2 rounded-full p-2 bg-red-500 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </Button>

          <EnhancedCharts data={chartData} c />
        </div>
      </div>
    )}
    </>
  );
};

export default VisualizationPanel;