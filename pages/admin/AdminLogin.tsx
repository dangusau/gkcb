import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../services/adminAuth'; // Update path
import {
  Shield,
  Mail,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkAdminSession = async () => {
      const admin = await adminAuth.getCurrentAdmin();
      if (admin) {
        navigate('/admin/dashboard');
      }
    };
    checkAdminSession();
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { success, admin, error } = await adminAuth.login(
        formData.email.trim(),
        formData.password.trim()
      );

      if (success && admin) {
        console.log('✅ Admin login successful:', admin.email);
        navigate('/admin/dashboard');
      } else {
        setError(error || 'Invalid admin credentials');
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Admin Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-red-500/30">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">GKBC Admin</h1>
          <p className="text-sm text-gray-400">Separate Admin Authentication</p>
        </div>

        {/* Admin Login Card */}
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white">Administrator Sign In</h2>
            <p className="text-xs text-gray-400 mt-2">Separate from user accounts</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-red-200 font-medium text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="admin@gkbc.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-11 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 flex items-center justify-center gap-3 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying Admin Access...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Demo credentials note */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <p className="text-xs text-gray-400 text-center">
              Default credentials: admin@gkbc.com / Admin123!
              <br />
              <span className="text-red-400">Change immediately after first login!</span>
            </p>
          </div>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-gray-700/50 space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full text-center text-gray-400 hover:text-gray-300 text-sm"
            >
              ← Return to User Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;