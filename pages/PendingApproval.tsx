// Create a new file: pages/PendingApproval.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Mail, 
  Shield, 
  AlertCircle,
  LogIn,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  // Prevent navigation away from this page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLoginRedirect = () => {
    navigate('/login', { replace: true });
  };

  const handleCheckStatus = async () => {
    // You can implement a status check here
    // For now, just show a message
    alert('Your account status is still pending. Please wait for admin approval.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col justify-center items-center px-4 py-8 safe-area">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-yellow-500/5 to-transparent" />
      <div className="absolute top-1/3 -right-16 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-16 w-64 h-64 bg-orange-400/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/30">
              <Clock size={48} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">Account Pending Approval</h1>
          <p className="text-gray-600 text-center px-4">
            Your account is under review by our admin team
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/80 p-6 mb-6">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="px-4 py-2 bg-yellow-100 border border-yellow-200 rounded-full">
                <span className="text-yellow-800 font-semibold text-sm flex items-center gap-2">
                  <Clock size={16} />
                  PENDING APPROVAL
                </span>
              </div>
            </div>

            {/* Status Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 text-sm mb-1">Email Confirmation</h3>
                  <p className="text-blue-700 text-xs">
                    Check your email for registration confirmation. You'll receive another email once your account is approved.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 text-sm mb-1">Processing Time</h3>
                  <p className="text-yellow-700 text-xs">
                    Approval usually takes 24-48 hours. Our admin team verifies all new accounts to ensure community quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 text-sm mb-1">After Approval</h3>
                  <p className="text-green-700 text-xs">
                    Once approved, you'll be able to log in and access all features of the GKBC platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <AlertCircle className="text-yellow-600" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800 text-sm mb-1">Access Restriction</h4>
                  <p className="text-yellow-700 text-xs">
                    Your account must be approved before you can access the main platform. 
                    You will remain on this page until admin approval is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleCheckStatus}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-orange-600 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Clock size={20} />
            Check Approval Status
          </button>
          
          <button
            onClick={handleLoginRedirect}
            className="w-full border-2 border-blue-500 text-blue-600 font-bold py-3.5 rounded-xl hover:bg-blue-50 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Go to Login Page
          </button>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Questions about your approval status?</p>
            <a 
              href="mailto:support@gkbc.com" 
              className="text-blue-600 font-semibold text-sm hover:text-blue-700"
            >
              support@gkbc.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;