import React from 'react';
import {
  FileKey, FileText, ZoomOut, ZoomIn, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, BookOpen, FileCog,
  Download, Table, Upload, BarChart2, PieChart, LineChart as LineChartIcon,
  LogIn, FileX2, Menu, Type, Plus, Sliders, Undo, Redo,
  AreaChart, ChartScatter, Radar, Layout, RadioTower, TrendingUp,
  ChevronDown
} from 'lucide-react';

import { useAuthStore, useSpreadsheetStore } from '../Store/useStore';
import { AuthGuard } from './AuthGuard';
import NewFileButton from './NewFileButton';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from './UserProfile';
const fonts = [
  "Roboto",
  "Open Sans",
  "Lora",
  "Playfair Display",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Merriweather",
  "Ubuntu",
  "Nunito",
  "Oswald",
  "Quicksand",
  "Dancing Script",
  "Josefin Sans",
  "Source Sans Pro",
  "Fira Sans",
  "Work Sans",
  "Rubik",
  "Bebas Neue",
  "Pacifico",
  "Caveat",
  "Cormorant Garamond",
  "Titillium Web",
  "Cinzel",
  "Amatic SC",
  "EB Garamond",
  "Bitter",
  "Karla",
  "Zilla Slab",
  "Noto Sans",
  "Nanum Gothic",
  "Overpass",
  "Arimo",
  "Mulish",
  "Barlow",
  "Lobster",
  "Righteous",
  "Teko",
  "Archivo",
  "Indie Flower",
  "Exo 2",
  "Baloo 2",
  "Abril Fatface",
  "Vollkorn",
  "Slabo 27px",
  "Catamaran",
  "Manrope",
  "Heebo",
  "Spectral",
  "Asap",
  "Prompt",
  "Dancing Script",
  "Pacifico",
  "Caveat",
  "Amatic SC",
  "Indie Flower",
  "Shadows Into Light",
  "Sacramento",
  "Great Vibes",
  "Satisfy",
  "Cookie",
  "Allura",
  "Alex Brush",
  "Just Another Hand",
  "Gloria Hallelujah",
  "Handlee",
  "Tangerine",
  "Mr Dafoe",
  "Mr Bedfort",
  "Pinyon Script",
  "Arizonia",
  "League Script",
  "Merienda",
  "Parisienne",
  "Kristi",
  "Zeyada",
  "Patrick Hand",
  "Marck Script",
  "Yellowtail",
  "Homemade Apple",
  "Over the Rainbow",
  "Beth Ellen",
  "Reenie Beanie",
  "Bad Script",
  "Calligraffitti",
  "Courgette",
  "Rouge Script",
  "Clicker Script",
  "Bilbo Swash Caps",
  "Bilbo",
  "El Messiri",
  "Qwigley",
  "Meddon",
  "Give You Glory",
  "Finger Paint",
  "Crafty Girls",
  "Loved by the King",
  "Italianno",
  "Tangerine",
  "Chewy",
  "Fredoka One"
];


function Headers(props) {
  const [showChartMenu, setShowChartMenu] = React.useState(false);
  const chartMenuRef = React.useRef(null);

  const undo = useSpreadsheetStore((state) => state.undo);
  const redo = useSpreadsheetStore((state) => state.redo);
  const undoStack = useSpreadsheetStore((state) => state.undoStack);
  const redoStack = useSpreadsheetStore((state) => state.redoStack);
  const { isAuthenticated } = useAuthStore();
  const { resetData } = useSpreadsheetStore();
  const navigate = useNavigate();
  const { fileUserName } = useAuthStore();

  const {
    handleDataSelection,
    exportToCSV,
    fileInputRef,
    importCSV,
    setGraphType,
    onTextFormat,
    onFontChange,
    onFontSizeChange,
    onZoom,
    onTextAlignment,
  } = props;

  // Chart types configuration
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', Icon: BarChart2 },
    { id: 'stackedBar', label: 'Stacked Bar', Icon: Layout },
    { id: 'line', label: 'Line Chart', Icon: LineChartIcon },
    { id: 'multiLine', label: 'Multi-Line Chart', Icon: TrendingUp },
    { id: 'area', label: 'Area Chart', Icon: AreaChart },
    { id: 'pie', label: 'Pie Chart', Icon: PieChart },
    { id: 'scatter', label: 'Scatter Plot', Icon: ChartScatter },
    { id: 'radar', label: 'Radar Chart', Icon: Radar },
    { id: 'composed', label: 'Composed Chart', Icon: Layout },
    { id: 'radialBar', label: 'Radial Bar', Icon: RadioTower },
  ];

  // Close chart menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (chartMenuRef.current && !chartMenuRef.current.contains(event.target)) {
        setShowChartMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-gray-900 text-white shadow-xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        {/* Left Section - File Operations */}
        <div className="flex items-center gap-3">
          <NewFileButton />

          {/* File Menu */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-800 bg-red-600">
              <Menu size={18} />
              <span>File</span>
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 bg-gray-800 rounded-lg p-2 mt-1 shadow-lg min-w-[200px] z-50">
              <label className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 cursor-pointer">
                <Upload size={16} />
                Import CSV
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden"
                />
              </label>
              <button
                onClick={exportToCSV}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700"
              >
                <FileCog size={16} />
                Admin Panel
              </button>
              <button
                onClick={() => navigate('/docs')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700"
              >
                <BookOpen size={16} />
                Documentation
              </button>
            </div>
          </div>
          <div className="text-sm text-white ml-2 bg-amber-500 p-2 rounded-md">
            Current File: <span className="font-mono">{fileUserName}</span>
          </div>
        </div>

        {/* Right Section - User & Zoom */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-sky-600 rounded-lg p-1">
          <button
            onClick={undo}
            disabled={!undoStack.length}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-800"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!redoStack.length}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-800 "
          >
            <Redo size={18} />
          </button>
          </div>
          <AuthGuard children={<UserProfile />} />
        </div>
      </div>

      {/* Bottom Bar - Tools */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Chart Controls */}
        <div className="flex items-center gap-2">
          {/* Chart Type Selection */}
          <div className="relative" ref={chartMenuRef}>
            <button
              onClick={() => setShowChartMenu(!showChartMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-800 hover:bg-gray-700 rounded-md"
            >
              <BarChart2 size={16} />
              Chart Type
              <ChevronDown size={14} className={`transform transition-transform ${showChartMenu ? 'rotate-180' : ''}`} />
            </button>
            {showChartMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg shadow-xl p-2 z-50 grid grid-cols-2 gap-1 min-w-[300px]">
                {chartTypes.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setGraphType(id);
                      setShowChartMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 w-full"
                  >
                    <Icon size={16} />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleDataSelection}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md"
          >
            <Sliders size={16} />
            Visualize Data
          </button>
        </div>

        {/* Formatting Tools */}
        <div className="flex items-center gap-4">
          {/* Font Controls */}
          <div className="flex items-center bg-teal-600 rounded-lg p-1">
            <select
              className="bg-teal-700 px-2 py-1 text-sm rounded-md hover:bg-gray-700"
              onChange={(e) => onFontChange(e.target.value)}
            >
              {fonts.map((font, index) => (
                <option key={index} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            <div className="flex">
              <button
                onClick={() => onFontSizeChange(prev => prev - 1)}
                className="px-2 py-1 hover:bg-gray-700 rounded-l-md"
              >
                A-
              </button>
              <button
                onClick={() => onFontSizeChange(prev => prev + 1)}
                className="px-2 py-1 hover:bg-gray-700 rounded-r-md"
              >
                A+
              </button>
            </div>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 bg-purple-600 rounded-lg p-1">
            <button
              onClick={() => onTextFormat("bold")}
              className="p-2 hover:bg-gray-700 rounded-md"
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => onTextFormat("italic")}
              className="p-2 hover:bg-gray-700 rounded-md"
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => onTextFormat("underline")}
              className="p-2 hover:bg-gray-700 rounded-md"
              title="Underline"
            >
              <Underline size={16} />
            </button>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center gap-1 bg-orange-600 rounded-lg p-1">
            {['left', 'center', 'right', 'justify'].map((align) => (
              <button
                key={align}
                onClick={() => onTextAlignment(align)}
                className="p-2 hover:bg-gray-700 rounded-md"
                title={`Align ${align}`}
              >
                {React.createElement(
                  { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[align],
                  { size: 16 }
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Headers;