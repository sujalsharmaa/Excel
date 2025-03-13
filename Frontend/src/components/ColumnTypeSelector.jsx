import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';

const ColumnTypeSelector = ({ hotInstance }) => {
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [currentType, setCurrentType] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState(['Option 1', 'Option 2', 'Option 3']);
  const [newOption, setNewOption] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasHeader, setHasHeader] = useState(false); // toggle state for header presence

  const dataTypes = [
    { value: 'text', label: 'Text' },
    { value: 'numeric', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'time', label: 'Time' },
  ];

  useEffect(() => {
    if (!hotInstance) return;

    const updateSelectedColumn = () => {
      const selected = hotInstance.getSelectedLast();
      if (selected) {
        const col = selected[1];
        setSelectedColumn(col);
        
        const currentColumns = hotInstance.getSettings().columns || [];
        const columnType = currentColumns[col]?.type || 'text';
        setCurrentType(
          columnType === 'numeric' &&
          currentColumns[col]?.numericFormat?.pattern === '$0,0.00'
            ? 'currency'
            : columnType
        );

        // Load existing dropdown options if available
        if (columnType === 'dropdown' && currentColumns[col]?.source) {
          setDropdownOptions(currentColumns[col].source);
        }
      }
    };

    hotInstance.addHook('afterSelection', updateSelectedColumn);
    return () => hotInstance.removeHook('afterSelection', updateSelectedColumn);
  }, [hotInstance]);

  const handleTypeChange = (value) => {
    if (!hotInstance || selectedColumn === null) return;

    const colCount = hotInstance.countCols();
    const currentColumns = hotInstance.getSettings().columns || Array(colCount).fill({});
    const updatedColumns = [...currentColumns];

    if (updatedColumns.length < colCount) {
      for (let i = updatedColumns.length; i < colCount; i++) {
        updatedColumns[i] = {};
      }
    }

    // Build new column settings based on the selected type
    const newColumnSettings = {
      type: value === 'currency' ? 'numeric' : value,
      ...(value === 'numeric' && { numericFormat: { pattern: '0,0.00' } }),
      ...(value === 'date' && { dateFormat: 'MM/DD/YYYY' }),
      ...(value === 'time' && { timeFormat: 'h:mm a, h:mm:ss a,h:mm' }),
      ...(value === 'dropdown' && { source: dropdownOptions }),
    };

    // If header is present, attach a custom cells function that “ignores” the header row
    if (hasHeader) {
      newColumnSettings.cells = (row, col) => {
        if (row === 0) {
          // You can also set readOnly, a custom renderer, etc.
          return { type: 'text', readOnly: true };
        }
        return {};
      };
    }

    updatedColumns[selectedColumn] = {
      ...updatedColumns[selectedColumn],
      ...newColumnSettings,
    };

    hotInstance.updateSettings({ columns: updatedColumns });
    setCurrentType(value);

    if (value === 'dropdown') {
      setIsDialogOpen(true);
    }

    hotInstance.render();
  };

  const addOption = () => {
    if (newOption.trim()) {
      const newOptions = [...dropdownOptions, newOption.trim()];
      setDropdownOptions(newOptions);
      updateDropdownOptions(newOptions);
      setNewOption('');
    }
  };

  const removeOption = (indexToRemove) => {
    const updatedOptions = dropdownOptions.filter((_, index) => index !== indexToRemove);
    setDropdownOptions(updatedOptions);
    updateDropdownOptions(updatedOptions);
  };

  const updateDropdownOptions = (options) => {
    if (!hotInstance || selectedColumn === null) return;

    const colCount = hotInstance.countCols();
    const currentColumns = hotInstance.getSettings().columns || Array(colCount).fill({});
    const updatedColumns = [...currentColumns];

    const baseColumnSettings = {
      type: 'dropdown',
      source: options,
    };

    if (hasHeader) {
      baseColumnSettings.cells = (row, col) => {
        if (row === 0) {
          return { type: 'text', readOnly: true };
        }
        return {};
      };
    }

    updatedColumns[selectedColumn] = {
      ...updatedColumns[selectedColumn],
      ...baseColumnSettings,
    };

    hotInstance.updateSettings({ columns: updatedColumns });
    hotInstance.render();
  };

  return (
    <div className="flex flex-row-reverse gap-4">
      {/* Toggle for header row */}
      <label className="flex items-center gap-2 bg-rose-700 p-1 rounded-md">
        <input
          type="checkbox"
          checked={hasHeader}
          onChange={() => setHasHeader(!hasHeader)}
        />
        <span>Header</span>
      </label>

      <div className="flex items-center gap-2">
        <Select 
          value={currentType} 
          onValueChange={handleTypeChange}
          disabled={selectedColumn === null}
        >
          <SelectTrigger className="w-fit bg-emerald-600 text-white border-none mx-2">
            <SelectValue placeholder={selectedColumn === null ? "Select a column" : "Column Type"} />
          </SelectTrigger>
          <SelectContent style={{ zIndex: 1200 }}>
            {dataTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="bg-slate-100">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentType === 'dropdown' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-pink-700">
                Manage Options
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Manage Dropdown Options</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Enter new option"
                    className="flex-1 text-black"
                  />
                  <Button onClick={addOption} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {dropdownOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100">
                      <span>{option}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ColumnTypeSelector;
