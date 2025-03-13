import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExcelClone from './components/Sheetwise';
import { NotFound } from './components/NotFound';
import AdminPanel from './components/AdminDashboard/AdminPanel';
import PermissionDenied from './components/PermissionDenied';
import { FileViewerbyToken } from './components/FileViewerByToken';
import TokenInvalidPage from './components/tokenExpiredPage';
import Documentation from './components/Documentation';
import StorageUpgrade from './components/StorageUpgrade';
import { Toaster } from 'react-hot-toast';
import ExcalidrawWrapper from './components/ExcalidrawWrapper';
import { useAuthStore } from './Store/useStore';
import ContactUsPage from './components/ContactUs';
import PaymentSuccessPage from './components/PaymentSuccessPage';



export default function App() {
  const {fileUrl,user} = useAuthStore()

  return (
    <Router>
      {/* Toaster should be outside Routes to work globally */}
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<ExcelClone />} />
        <Route path="/file/:fileURL" element={<ExcelClone />} />
        <Route path="*" element={<NotFound />} /> {/* Catch-all route for 404 pages */}
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/permission_denied" element={<PermissionDenied />} />
        <Route path="/token_expired_or_invalid" element={<TokenInvalidPage />} />
        <Route path="/token/file/:FILEURL/:token" element={<FileViewerbyToken />} />
        <Route path="/upgradeStorage" element={<StorageUpgrade />} />
        <Route path="/contact_us" element={<ContactUsPage/>} />
        <Route path='/whiteboard' element={<ExcalidrawWrapper fileId={fileUrl} user={user}/>} />
        <Route path="/payment-success/:payment_id" element={<PaymentSuccessPage />} /> {/* New route for payment success */}
      </Routes>
    </Router>
  );
}



