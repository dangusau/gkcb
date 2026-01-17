import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Shield,
  Smartphone,
  Building,
  Clock,
  UserX,
  X
} from 'lucide-react';
import { supabase } from '../services/supabase';

/**
 * Interface for login form data
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Interface for user profile data
 */
interface UserProfile {
  id: string;
  email: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  role: string;
}

/**
 * Login status from authentication and profiles table
 */
interface LoginStatus {
  status: 'credentials_correct' | 'credentials_incorrect' | 'no_account';
  profile?: UserProfile;
  error?: string;
}

/**
 * Status Modal Component for Login
 * Shows different messages based on login status
 */
const LoginStatusModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  email: string;
  status: 'pending' | 'rejected' | 'no_account' | 'credentials_incorrect';
  onSignupClick: () => void;
  onApprovalRedirect?: () => void;
  onTryAgain?: () => void;
  onForgotPassword?: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  email, 
  status, 
  onSignupClick, 
  onApprovalRedirect, 
  onTryAgain,
  onForgotPassword 
}) => {
  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (status) {
      case 'pending':
        return {
          title: 'Account Pending Approval',
          icon: <Clock className="text-yellow-600" size={32} />,
          iconBg: 'from-yellow-100 to-yellow-50',
          iconBorder: 'border-yellow-200',
          message: (
            <>
              <p className="text-gray-600 mb-3">
                Your account with email <span className="font-semibold text-blue-600">{email}</span> is pending admin approval.
              </p>
              <p className="text-gray-600">
                Please wait for approval before you can access the platform. You will be notified by email.
              </p>
            </>
          ),
          primaryButton: 'Go to Approval Page',
          secondaryButton: 'Close',
          primaryAction: onApprovalRedirect,
          secondaryAction: onClose,
        };
      case 'rejected':
        return {
          title: 'Account Rejected',
          icon: <UserX className="text-red-600" size={32} />,
          iconBg: 'from-red-100 to-red-50',
          iconBorder: 'border-red-200',
          message: (
            <>
              <p className="text-gray-600 mb-3">
                Your account with email <span className="font-semibold text-blue-600">{email}</span> has been rejected by admin.
              </p>
              <p className="text-gray-600">
                Please contact support@gkbc.com for more information or to appeal the decision.
              </p>
            </>
          ),
          primaryButton: 'Contact Support',
          secondaryButton: 'Close',
          primaryAction: () => window.open('mailto:support@gkbc.com', '_blank'),
          secondaryAction: onClose,
        };
      case 'no_account':
        return {
          title: 'No Account Found',
          icon: <UserX className="text-blue-600" size={32} />,
          iconBg: 'from-blue-100 to-blue-50',
          iconBorder: 'border-blue-200',
          message: (
            <>
              <p className="text-gray-600 mb-3">
                No account found with email <span className="font-semibold text-blue-600">{email}</span>.
              </p>
              <p className="text-gray-600">
                Please sign up to create a new account and join our business community.
              </p>
            </>
          ),
          primaryButton: 'Sign Up',
          secondaryButton: 'Try Different Email',
          primaryAction: onSignupClick,
          secondaryAction: onClose,
        };
      case 'credentials_incorrect':
        return {
          title: 'Incorrect Credentials',
          icon: <AlertCircle className="text-red-600" size={32} />,
          iconBg: 'from-red-100 to-red-50',
          iconBorder: 'border-red-200',
          message: (
            <>
              <p className="text-gray-600 mb-3">
                The email or password you entered is incorrect.
              </p>
              <p className="text-gray-600">
                Please check your credentials and try again.
              </p>
            </>
          ),
          primaryButton: 'Try Again',
          secondaryButton: 'Forgot Password?',
          primaryAction: onTryAgain,
          secondaryAction: onForgotPassword,
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 animate-scale-in">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${config.iconBg} rounded-full flex items-center justify-center border ${config.iconBorder}`}>
              {config.icon}
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center">{config.title}</h3>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            {config.message}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={config.primaryAction}
              className={`w-full ${
                status === 'rejected' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : status === 'pending'
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                  : status === 'no_account'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              } text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition-all duration-200 min-h-[44px]`}
              aria-label={config.primaryButton}
            >
              {config.primaryButton}
            </button>
            <button
              onClick={config.secondaryAction}
              className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 active:scale-[0.99] transition-all duration-200 min-h-[44px]"
              aria-label={config.secondaryButton}
            >
              {config.secondaryButton}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

/**
 * Login Component
 * 
 * Handles user authentication with mobile optimization for Capacitor.
 * Features include:
 * - 4-case login logic based on credentials and approval status
 * - Admin role detection and redirection
 * - Secure authentication with Supabase
 * - Profile approval status checking
 * - Mobile-responsive design
 * - Touch-friendly UI elements
 * 
 * Mobile Optimization Notes:
 * - All touch targets are at least 44x44px
 * - Input fields have proper mobile attributes (inputMode, autoComplete)
 * - Safe-area padding for notched devices
 * - Blue borders for better input visibility
 */
const Login: React.FC = () => {
  const navigate = useNavigate();

  // Form state management
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  // UI state management
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'pending' | 'rejected' | 'no_account' | 'credentials_incorrect'>('credentials_incorrect');

  /**
   * Safely retrieves user profile from profiles table
   * @param email - User's email address
   * @returns UserProfile object or null if not found
   */
  const getProfileByEmail = async (email: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, approval_status, role')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        email: data.email,
        approval_status: data.approval_status as 'pending' | 'approved' | 'rejected',
        role: data.role,
      };
      
    } catch (error) {
      return null;
    }
  };

  /**
   * Checks login status and handles 4 cases
   */
  const checkLoginStatus = async (email: string, password: string): Promise<LoginStatus> => {
    try {
      // Step 1: Check if profile exists
      const profile = await getProfileByEmail(email);
      
      if (!profile) {
        return {
          status: 'no_account',
          error: 'No account found with this email',
        };
      }
      
      // Step 2: Try to authenticate
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (authError) {
        // Handle authentication errors
        if (authError.message.includes('Invalid login credentials')) {
          return {
            status: 'credentials_incorrect',
            error: 'Invalid email or password',
          };
        }
        
        // Other auth errors
        return {
          status: 'credentials_incorrect',
          error: authError.message,
        };
      }
      
      if (!authData.user) {
        return {
          status: 'credentials_incorrect',
          error: 'Authentication failed',
        };
      }
      
      // Step 3: Check approval status
      return {
        status: 'credentials_correct',
        profile,
      };
      
    } catch (error: any) {
      return {
        status: 'credentials_incorrect',
        error: error.message || 'Login failed',
      };
    }
  };

  /**
   * Handles modal close
   */
  const handleModalClose = () => {
    setShowStatusModal(false);
    
    // Clear password field for "credentials_incorrect" case
    if (loginStatus === 'credentials_incorrect') {
      setFormData(prev => ({ ...prev, password: '' }));
    }
    
    // Clear email field for "no_account" case
    if (loginStatus === 'no_account') {
      setFormData(prev => ({ ...prev, email: '' }));
    }
  };

  /**
   * Handles signup navigation from modal
   */
  const handleSignupFromModal = () => {
    setShowStatusModal(false);
    navigate('/signup', { 
      state: { prefilledEmail: formData.email } 
    });
  };

  /**
   * Handles redirect to pending approval page
   */
  const handleRedirectToApproval = () => {
    setShowStatusModal(false);
    navigate('/pending-approval', { replace: true });
  };

  /**
   * Handles try again after incorrect credentials
   */
  const handleTryAgain = () => {
    setShowStatusModal(false);
    setFormData(prev => ({ ...prev, password: '' }));
    // Focus on password field
    setTimeout(() => {
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (passwordInput) passwordInput.focus();
    }, 100);
  };

  /**
   * Handles forgot password navigation
   */
  const handleForgotPassword = () => {
    setShowStatusModal(false);
    navigate('/forgot-password');
  };

  /**
   * Handles login form submission with role-based routing
   * Implements 4-case logic with admin detection:
   * 1. Credentials correct + approved + admin role → Admin dashboard
   * 2. Credentials correct + approved + user role → User home
   * 3. Credentials correct + pending → Pending feedback
   * 4. Credentials correct + rejected → Rejection feedback
   * 5. Credentials incorrect → Credentials feedback
   * 6. No account → Sign up feedback
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loginStatus = await checkLoginStatus(formData.email.trim(), formData.password.trim());
      
      // Case 5: Credentials incorrect
      if (loginStatus.status === 'credentials_incorrect') {
        setLoginStatus('credentials_incorrect');
        setShowStatusModal(true);
        setIsLoading(false);
        return;
      }
      
      // Case 6: No account found
      if (loginStatus.status === 'no_account') {
        setLoginStatus('no_account');
        setShowStatusModal(true);
        setIsLoading(false);
        return;
      }
      
      // Cases 1-4: Credentials correct
      if (loginStatus.status === 'credentials_correct' && loginStatus.profile) {
        const profile = loginStatus.profile;
        
        // Case 1 & 2: Approved (admin or user)
        if (profile.approval_status === 'approved') {
          // Check role - admin gets different dashboard
          if (profile.role === 'admin' || profile.role === 'super_admin') {
            navigate('/admin/dashboard'); // Admin dashboard
          } else {
            navigate('/home'); // Regular user home
          }
          return;
        }
        
        // Case 3: Pending
        if (profile.approval_status === 'pending') {
          setLoginStatus('pending');
          setShowStatusModal(true);
          setIsLoading(false);
          return;
        }
        
        // Case 4: Rejected
        if (profile.approval_status === 'rejected') {
          setLoginStatus('rejected');
          setShowStatusModal(true);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback error
      setError('Login failed. Please try again.');
      
    } catch (err: any) {
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

  /**
   * Handles input changes and clears any existing errors
   */
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <>
      {/* Login Status Modal */}
      <LoginStatusModal
        isOpen={showStatusModal}
        onClose={handleModalClose}
        email={formData.email}
        status={loginStatus}
        onSignupClick={handleSignupFromModal}
        onApprovalRedirect={handleRedirectToApproval}
        onTryAgain={handleTryAgain}
        onForgotPassword={handleForgotPassword}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col justify-center items-center px-4 relative overflow-hidden safe-area">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-600/10 to-transparent" />
        
        {/* Animated Background Circles */}
        <div className="absolute top-1/4 -right-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-16 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />
        
        {/* Main Container */}
        <div className="w-full max-w-md relative z-10">
          {/* App Branding with Logo */}
          <div className="flex flex-col items-center mb-8">
            {/* GKBC Logo */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 overflow-hidden border-2 border-blue-100">
                <img 
                  src="/gkbclogo.png" 
                  alt="GKBC Logo" 
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    // Fallback if logo doesn't load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span class="text-white font-bold text-lg">GKBC</span>
                      </div>
                    `;
                  }}
                />
              </div>
            </div>
            
            {/* GKBC Title */}
            <div className="mb-4">
              <h1 className="text-3xl font-black text-gray-900 text-center">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GKBC
                </span>
              </h1>
              <p className="text-sm text-gray-500 text-center font-medium mt-1">
                Africa's Emerging Economic Vanguard
              </p>
            </div>
            
            {/* Login Header - Centered */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                Sign in to access your business network
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden mb-6">
            {/* Card Body */}
            <div className="p-6">
              {/* Error Display */}
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

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 pl-1">
                    Email Address *
                  </label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                      <Mail className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 min-h-[44px] min-w-[44px] items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-transform min-h-[44px] min-w-[44px]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 min-h-[52px]"
                  aria-label={isLoading ? 'Signing in...' : 'Sign In'}
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
                  className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-[44px]"
                  aria-label="Sign up for a new account"
                >
                  Don't have an account? Sign Up
                </button>
                
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full text-center text-gray-500 hover:text-gray-700 text-sm py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
                  aria-label="Reset your password"
                >
                  Forgot your password?
                </button>
                
                {/* Removed Administrator Access button */}
                {/* Admins will automatically be redirected based on role */}
              </div>
            </div>
          </div>

          {/* Security Footer */}
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
                <span className="text-xs text-gray-600 font-medium">GKBC</span>
              </div>
            </div>
          </div>
          
          {/* App Version */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">GKBC Network v1.0</p>
          </div>
        </div>

        {/* Capacitor Safe Area Bottom Padding */}
        <div className="h-8" />
      </div>
    </>
  );
};

export default Login;