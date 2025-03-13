{/* Font Size Control */}
<div className="flex items-center gap-2">
  <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
    <button 
      onClick={handleDecreaseFontSize}
      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-white flex items-center"
      title="Decrease font size"
    >
      <Minus className="w-4 h-4" />
    </button>
    
    <div className="px-2 text-white flex items-center">
      <Type className="w-4 h-4 mr-1" />
      <span className="text-xs whitespace-nowrap">{fontSize}px</span>
    </div>
    
    <button 
      onClick={handleIncreaseFontSize}
      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-white flex items-center"
      title="Increase font size"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
  
  {isSelectingCells && (
    <Button 
      onClick={handleApplyFontSize}
      className={`px-3 py-1 flex items-center gap-1 rounded-lg ${selectedCells ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
      disabled={!selectedCells}
      title={selectedCells ? "Apply font size to selected cells" : "Select cells first"}
    >
      <Check className="w-4 h-4" />
      <span className="text-xs">Apply Font Size</span>
    </Button>
  )}
</div>