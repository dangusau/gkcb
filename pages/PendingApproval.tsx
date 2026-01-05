import React, { useEffect, useState } from 'react';
import { LogOut, Clock, Mail, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentProfile } from '../services/supabase';

const PendingApproval = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await getCurrentProfile();
      if (profile) {
        setUserEmail(profile.email);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Clock size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Approval Pending</h1>
          <p className="text-gray-600 text-center mt-2">
            Your account is awaiting admin approval
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          {/* Email Display */}
          {userEmail && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Registered Email</p>
                  <p className="text-blue-700 font-semibold">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Process Steps */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Admin Verification</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Our admin team is reviewing your registration details and business information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Processing Time</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Approval usually takes 24-48 hours during business days.
                  You'll receive an email notification once approved.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Next Steps</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Once approved, you can login and access all features including:
                  business networking, marketplace, events, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600">
              If you have questions or need to update your information, contact our support team:
            </p>
            <div className="mt-2 text-sm">
              <p className="text-primary-600 font-semibold">support@gkbc.com</p>
              <p className="text-gray-500">+234 800 123 4567</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition"
            >
              Check Approval Status
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            You can try logging in anytime to check if your account has been approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-primary-600 font-semibold text-sm hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;