import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuthStore } from '@/Store/useStore';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUserStorage } = useAuthStore();
  const pid = useParams()
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract query parameters
        const searchParams = new URLSearchParams(location.search);
        const paymentId = searchParams.get('payment_id');
       
        console.log(location.search)
        
        // if (!paymentId) {
        //   setVerificationStatus('error');
        //   toast.error('Invalid payment information');
        //   return;
        // }
        
        // Call your backend API to verify the payment
        console.log(pid)
        const response = await axios.post(
          `${process.env.VITE_PUBLIC_API_URL}/payment-success`,
          {pid},
          { withCredentials: true }
        
        );
        
        if (response.data.success) {
          setVerificationStatus('success');
          
          // Update user storage in frontend state if needed
          if (response.data.updatedStorage) {
            updateUserStorage(response.data.updatedStorage);
          }
          
          toast.success('Payment successful! Your storage has been upgraded.');
          
          // Redirect after success (optional)
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setVerificationStatus('error');
          toast.error('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
        toast.error('Failed to verify payment');
      }
    };
    
    verifyPayment();
  }, [location.search, navigate, updateUserStorage]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {verificationStatus === 'verifying' && (
          <>
            <div className="flex justify-center mb-4">
              <Loader className="h-16 w-16 text-lime-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}
        
        {verificationStatus === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your storage has been upgraded successfully.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-lime-500 hover:bg-lime-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}
        
        {verificationStatus === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">We couldn't verify your payment. Please contact support if you believe this is an error.</p>
            <div className="flex space-x-4 justify-center">
              <button 
                onClick={() => navigate('/upgradeStorage')}
                className="bg-lime-500 hover:bg-lime-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;