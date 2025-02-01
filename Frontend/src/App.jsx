import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExcelClone from './components/ExcelClone';
import { FileViewer } from './components/FileViewer';
import {NotFound} from "./components/NotFound"
import AdminPanel from './components/AdminDashboard/AdminPanel';
import PermissionDenied from './components/PermissionDenied';
import { FileViewerbyToken } from './components/FileViewerByToken';
import TokenInvalidPage from './components/tokenExpiredPage';


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
        <Route path="/token_expired_or_invalid" element={<TokenInvalidPage/>} />
        <Route path="/token/file/:fileURL/:token" element={<FileViewerbyToken/>} />
      </Routes>
    </Router>
  );
}