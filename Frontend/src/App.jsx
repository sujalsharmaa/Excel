import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExcelClone from './components/ExcelClone';
import { FileViewer } from './components/FileViewer';
import {NotFound} from "./components/NotFound"
import AdminPanel from './components/AdminDashboard/AdminPanel';
import PermissionDenied from './components/PermissionDenied';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExcelClone />} />
        <Route path="/file/:fileURL" element={<FileViewer />} />
        <Route path="*" element={<NotFound/>} /> {/* Catch-all route for 404 pages */}
        {/* <Route path='/docs' element={<Docs/>} />  */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/permission_denied" element={<PermissionDenied/>} />
      </Routes>
    </Router>
  );
}