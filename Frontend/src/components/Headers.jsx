import React from 'react';
import { UserProfile } from './UserProfile.jsx';
import {
  FileKey, FileText, ZoomOut, ZoomIn, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,BookOpen 
} from 'lucide-react';
import {
  Download, Table, Upload, BarChart2, PieChart, 
  LineChart as LineChartIcon, LogIn, FileX2
} from 'lucide-react';
import { useAuthStore } from '../Store/useStore.js';
import { AuthGuard } from './AuthGuard.jsx';
import { useSpreadsheetStore } from '../Store/useStore.js';
import { useNavigate } from 'react-router-dom';

//const navigate = useNavigate()


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
  const { isAuthenticated } = useAuthStore();
  const { resetData } = useSpreadsheetStore();
  const navigate = useNavigate();
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

  return (
    <header className="w-full h-28 border-b-4 border-gray-700 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 text-white shadow-lg flex items-center justify-between px-4">
      {/* Left Section: Chart Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => setGraphType("bar")}
          className="flex items-center bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow"
        >
          <BarChart2 size={20} />
        </button>
        <button
          onClick={() => setGraphType("pie")}
          className="flex items-center bg-green-600 hover:bg-green-500 text-white p-2 rounded shadow"
        >
          <PieChart size={20} />
        </button>
        <button
          onClick={() => setGraphType("line")}
          className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded shadow"
        >
          <LineChartIcon size={20} />
        </button>
        <button
          onClick={handleDataSelection}
          className="flex items-center bg-purple-600 hover:bg-purple-500 p-2 rounded shadow"
        >
          Visualize Data
        </button>
      </div>

      {/* Middle Section: Text Editing Tools */}
      <div className="flex gap-4 items-center">
      <div className="flex gap-2">
      {/* Font Selector */}
      <select
        className="p-2 bg-gray-800 text-white rounded shadow"
        name="font"
        id="font"
        onChange={(e) => onFontChange(e.target.value)}
      >
        {fonts.map((font, index) => (
          <option
            key={index}
            value={font}
            style={{ fontFamily: font }}
          >
            {font}
          </option>
        ))}
      </select>
      
      {/* Font Size Controls */}
      <button
        className="bg-gray-800 p-2 rounded shadow"
        onClick={() => onFontSizeChange((prev)=>prev+1)}
      >
        A+
      </button>
      <button
        className="bg-gray-800 p-2 rounded shadow"
        onClick={() => onFontSizeChange((prev)=>prev-1)}
      >
        A-
      </button>
    </div>
        <div className="flex gap-2">
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextFormat("bold")}>
            <Bold />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextFormat("italic")}>
            <Italic />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextFormat("underline")}>
            <Underline />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextAlignment("left")}>
            <AlignLeft />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextAlignment("center")}>
            <AlignCenter />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextAlignment("right")}>
            <AlignRight />
          </button>
          <button className="bg-gray-800 p-2 rounded shadow" onClick={() => onTextAlignment("justify")}>
            <AlignJustify />
          </button>
        </div>
      </div>

      {/* Right Section: File and Zoom Controls */}
      <div className="flex gap-4 items-center">
      <button 
  className="flex items-center bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow"
  onClick={() => navigate('/docs')}
>  
  <BookOpen className="w-6 h-6" />
   docs
</button>
        <button
          onClick={exportToCSV}
          className="flex items-center bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow"
        >
          <Download size={20} />
          Export CSV
        </button>
        <label className="flex items-center bg-purple-600 hover:bg-purple-500 text-white p-2 rounded shadow cursor-pointer">
          <Upload size={20} />
          Import CSV
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={importCSV}
            className="hidden"
          />
        </label>


      </div>

      {/* User Profile */}
      <div className="flex items-center">
        {<AuthGuard children={<UserProfile />} />}
      </div>
    </header>
  );
}

export default Headers;
