import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExcelClone from './components/ExcelClone';
import { FileViewer } from './components/FileViewer';
import {NotFound} from "./components/NotFound"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExcelClone />} />
        <Route path="/file/:fileURL" element={<FileViewer />} />
        <Route path="*" element={<NotFound/>} /> {/* Catch-all route for 404 pages */}
        {/* <Route path='/docs' element={<Docs/>} />  */}
      </Routes>
    </Router>
  );
}