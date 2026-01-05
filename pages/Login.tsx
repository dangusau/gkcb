import React, { useState } from 'react';
import {
  Hexagon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  Shield,
  Smartphone,
  Building,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get profile with schema error handling
  const getProfileSafely = async (userId: string) => {
    console.log('🔄 Fetching profile for user:', userId);
    
    try {
      // Method 1: Try minimal query first (most likely to succeed)
      const { data: minimalData, error: minimalError } = await supabase
        .from('profiles')
        .select('id, approval_status, role, email')
        .eq('id', userId)
        .maybeSingle();
      
      if (!minimalError && minimalData) {
        console.log('✅ Minimal profile query succeeded:', minimalData);
        return minimalData;
      }
      
      console.warn('Minimal query failed, trying alternative...');
      
      // Method 2: Try to get just approval_status
      const { data: statusData } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', userId)
        .maybeSingle();
      
      if (statusData) {
        console.log('✅ Got approval_status:', statusData);
        return { 
          id: userId, 
          approval_status: statusData.approval_status || 'pending',
          role: 'member',
          email: formData.email
        };
      }
      
      // Method 3: Check if any profile exists
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('id', userId);
      
      if (count && count > 0) {
        console.log('✅ Profile exists but schema query failed');
        return { 
          id: userId, 
          approval_status: 'pending',
          role: 'member',
          email: formData.email
        };
      }
      
      console.error('❌ No profile found for user:', userId);
      return null;
      
    } catch (schemaError: any) {
      console.error('❌ Schema error in profile query:', schemaError);
      
      // Last resort: create a basic profile object
      return { 
        id: userId, 
        approval_status: 'pending',
        role: 'member',
        email: formData.email
      };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting login process...');
      
      // Step 1: Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (authError || !data.user) {
        console.error('Auth error:', authError);
        throw new Error(authError?.message || 'Login failed. Please check your credentials.');
      }

      console.log('✅ Authentication successful. User ID:', data.user.id);
      
      // Step 2: Get user profile with error handling
      const profile = await getProfileSafely(data.user.id);
      
      if (!profile) {
        console.log('⚠️ No profile found, redirecting to pending approval');
        navigate('/pending-approval');
        return;
      }
      
      console.log('📋 Profile data:', profile);
      
      // Step 3: Handle based on approval status
      const approvalStatus = profile.approval_status || 'pending';
      
      switch (approvalStatus) {
        case 'pending':
          console.log('⏳ User is pending approval');
          navigate('/pending-approval');
          break;
          
        case 'rejected':
          console.log('❌ User account was rejected');
          setError('Your account has been rejected. Please contact support.');
          await supabase.auth.signOut();
          break;
          
        case 'approved':
          console.log('✅ User is approved');
          
          // Check if admin
          if (profile.role === 'admin') {
            console.log('👑 Admin user detected');
            navigate('/admin/dashboard');
          } else {
            console.log('👤 Regular user detected');
            navigate('/home');
          }
          break;
          
        default:
          console.warn('⚠️ Unknown approval status:', approvalStatus);
          navigate('/pending-approval');
      }
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      // User-friendly error messages
      let errorMessage = err.message || 'Login failed. Please try again.';
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        errorMessage = 'Too many login attempts. Please try again in 15 minutes.';
      } else if (errorMessage.includes('schema') || errorMessage.includes('Database error')) {
        errorMessage = 'System maintenance in progress. Please try again in a few minutes.';
      }
      
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Quick test logins for development
  const handleTestLogin = (email: string, password: string) => {
    setFormData({ email, password });
    
    // Auto-submit after delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col justify-center items-center px-4 relative overflow-hidden safe-area">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-600/10 to-transparent" />
      
      {/* Animated Background Circles */}
      <div className="absolute top-1/4 -right-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-16 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />
      
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* App Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
              <Hexagon size={32} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Briefcase size={14} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">GKBC Network</h1>
          <p className="text-sm text-gray-500 font-medium">Business Community Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600/5 to-blue-500/5 border-b border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to access your business network</p>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="text-red-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-800 font-medium text-sm">{error}</p>
                    <p className="text-red-600 text-xs mt-1">
                      Contact support@gkbc.com if this persists
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 pl-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <Mail className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2 pl-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff size={12} />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <Lock className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Actions */}
            <div className="mt-6 space-y-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                Don't have an account? Sign Up
              </button>
              
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Forgot your password?
              </button>
              
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full text-center text-gray-600 hover:text-gray-800 font-medium text-sm py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Shield size={14} />
                <span>Administrator Access</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Development Quick Logins */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3 font-medium">Development Quick Login:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTestLogin('user@test.com', 'Test123!')}
                    className="text-xs bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-blue-700 py-3 rounded-lg border border-blue-200 active:scale-95 transition-all flex flex-col items-center gap-1"
                  >
                    <User size={12} />
                    <span>Test User</span>
                  </button>
                  <button
                    onClick={() => handleTestLogin('admin@gkbc.com', 'Admin123!')}
                    className="text-xs bg-gradient-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 text-red-700 py-3 rounded-lg border border-red-200 active:scale-95 transition-all flex flex-col items-center gap-1"
                  >
                    <Shield size={12} />
                    <span>Test Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 px-4">
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-1">
                  <Shield size={14} className="text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Secure</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-1">
                  <Building size={14} className="text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Verified</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-1">
                  <Smartphone size={14} className="text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Mobile</span>
              </div>
            </div>
          </div>
          
          {/* App Version */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">GKBC Network v1.0 • Mobile App</p>
          </div>
        </div>
      </div>

      {/* Capacitor Safe Area Bottom Padding */}
      <div className="h-8" />
    </div>
  );
};

export default Login;