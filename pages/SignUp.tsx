import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Hexagon, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Phone, 
  User, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Building,
  Smartphone,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
  });

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError(null);
    }

    // Update password strength and criteria
    if (field === 'password') {
      const password = value as string;
      const criteria = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
      };
      setPasswordCriteria(criteria);
      
      // Calculate strength (0-100)
      let strength = 0;
      if (criteria.length) strength += 33;
      if (criteria.uppercase) strength += 33;
      if (criteria.number) strength += 34;
      setPasswordStrength(strength);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (optional but format check)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setServerError(null);
    
    try {
      console.log('🚀 Starting signup process...');
      
      // Step 1: Create auth user
      console.log('🔐 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim(),
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific auth errors
        if (authError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in.');
        } else if (authError.message.includes('weak password')) {
          throw new Error('Password is too weak. Please use a stronger password.');
        } else {
          throw new Error(`Authentication failed: ${authError.message}`);
        }
      }
      
      if (!authData.user) {
        throw new Error('User creation failed. Please try again.');
      }
      
      console.log('✅ Auth user created:', authData.user.id);
      
      // Step 2: Create profile
      console.log('👤 Creating user profile...');
      
      let profileCreated = false;
      let profileError = null;
      
      // Try direct insert
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email.trim(),
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          approval_status: 'pending',
          role: 'member',
        });
      
      profileError = insertError;
      
      if (profileError) {
        console.warn('Profile insert warning:', profileError.message);
        
        // Try upsert
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: formData.email.trim(),
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || null,
            approval_status: 'pending',
            role: 'member',
          }, {
            onConflict: 'id',
          });
        
        profileError = upsertError;
      }
      
      // Check if profile was actually created
      if (profileError) {
        console.warn('Profile creation had issues:', profileError);
        
        // Wait and check if profile exists anyway
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (existingProfile) {
          console.log('✅ Profile exists despite error');
          profileCreated = true;
        }
      } else {
        profileCreated = true;
        console.log('✅ Profile created successfully');
      }
      
      if (!profileCreated) {
        console.error('❌ Profile creation failed completely');
        throw new Error('Failed to create user profile. Please try again or contact support.');
      }
      
      // Success!
      console.log('🎉 Signup process completed successfully');
      setSuccess(true);
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/pending-approval');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Signup process failed:', error);
      
      // Format error message for user
      let userMessage = error.message || 'Registration failed. Please try again.';
      
      // Make error messages more user-friendly
      if (userMessage.includes('Database error')) {
        userMessage = 'System error. Our team has been notified. Please try again in a few minutes.';
      } else if (userMessage.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      setServerError(userMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col justify-center items-center px-4 py-8 safe-area">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-500/5 to-transparent" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 bg-green-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-16 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Success Animation */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckCircle size={48} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Check size={20} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">Welcome Aboard!</h1>
            <p className="text-gray-600 text-center px-4">
              Your account has been created successfully
            </p>
          </div>

          {/* Success Steps Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/80 p-6 mb-6">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Admin Approval</h3>
                  <p className="text-gray-600 text-sm">
                    Your account is now pending review by our admin team. This usually takes 24-48 hours.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-yellow-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Email Notification</h3>
                  <p className="text-gray-600 text-sm">
                    You'll receive an email at <span className="font-semibold text-blue-600">{formData.email}</span> once your account is approved.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Full Access</h3>
                  <p className="text-gray-600 text-sm">
                    After approval, you'll have access to our complete business networking platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Redirecting to approval page...</span>
                <span className="text-sm font-medium text-blue-600">3s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Need help? Contact our support team</p>
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
  }

  // Main signup form
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col justify-center items-center px-4 py-8 safe-area relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-600/10 to-transparent" />
      <div className="absolute top-1/4 -right-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-16 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl" />
      
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Hexagon size={36} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Building size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Join GKBC Network</h1>
          <p className="text-sm text-gray-500 font-medium text-center">
            Connect with local entrepreneurs and grow your business
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden mb-6">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600/5 to-blue-500/5 border-b border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">Create Business Account</h2>
            <p className="text-sm text-gray-500 mt-1">All fields marked with * are required</p>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Server Error Display */}
            {serverError && (
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="text-red-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-800 font-medium text-sm">{serverError}</p>
                    <p className="text-red-600 text-xs mt-1">
                      Please try again or contact support@gkbc.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 pl-1">
                    First Name *
                  </label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                      <User className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                        validationErrors.firstName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-200'
                      }`}
                      placeholder="John"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  {validationErrors.firstName && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <X size={12} />
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 pl-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                      validationErrors.lastName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200'
                    }`}
                    placeholder="Doe"
                    required
                    autoComplete="family-name"
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <X size={12} />
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pl-1">
                  Business Email *
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <Mail className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                      validationErrors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200'
                    }`}
                    placeholder="john@company.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X size={12} />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pl-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <Phone className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                      validationErrors.phone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200'
                    }`}
                    placeholder="+234 800 000 0000"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X size={12} />
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
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
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                      validationErrors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200'
                    }`}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
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

                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength < 50 ? 'text-red-600' :
                        passwordStrength < 80 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength < 50 ? 'Weak' :
                         passwordStrength < 80 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength < 50 ? 'bg-red-500' :
                          passwordStrength < 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    
                    {/* Password Criteria */}
                    <div className="grid grid-cols-1 gap-1 mt-3">
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordCriteria.length ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordCriteria.length ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {passwordCriteria.length ? <Check size={10} /> : <X size={10} />}
                        </div>
                        <span>At least 6 characters</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordCriteria.uppercase ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordCriteria.uppercase ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {passwordCriteria.uppercase ? <Check size={10} /> : <X size={10} />}
                        </div>
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordCriteria.number ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordCriteria.number ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {passwordCriteria.number ? <Check size={10} /> : <X size={10} />}
                        </div>
                        <span>One number</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {validationErrors.password && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X size={12} />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pl-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
                    validationErrors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200'
                  }`}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X size={12} />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer active:scale-95 transition-transform">
                  <div className="relative mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      className={`h-5 w-5 rounded border focus:ring-2 transition-all ${
                        validationErrors.agreeToTerms
                          ? 'border-red-300 text-red-600 focus:ring-red-500/20'
                          : 'border-gray-300 text-blue-600 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 font-semibold hover:underline">
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                    {validationErrors.agreeToTerms && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <X size={12} />
                        {validationErrors.agreeToTerms}
                      </p>
                    )}
                  </div>
                </label>
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
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Business Account</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">Already have an account?</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Login Link */}
            <button
              onClick={() => navigate('/login')}
              className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 active:scale-[0.99] transition-all duration-200"
            >
              Sign In Instead
            </button>
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
              <span className="text-xs text-gray-600 font-medium">Mobile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;