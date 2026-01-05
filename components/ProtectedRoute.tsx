import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireApproval?: boolean; // Default true for users
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  requireApproval = true 
}) => {
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string>('/');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setRedirectTo('/');
        setAccessGranted(false);
        setLoading(false);
        return;
      }

      // For admin routes, use AdminRoute component instead
      if (adminOnly) {
        setRedirectTo('/admin/login');
        setAccessGranted(false);
        setLoading(false);
        return;
      }

      // For regular user routes
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('approval_status, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !profile) {
          console.warn('Profile not found or error:', error);
          
          if (requireApproval) {
            setRedirectTo('/pending-approval');
            setAccessGranted(false);
          } else {
            // If approval not required and no profile, allow access
            setAccessGranted(true);
          }
          setLoading(false);
          return;
        }

        // Check approval status if required
        if (requireApproval && profile.approval_status !== 'approved') {
          setRedirectTo('/pending-approval');
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        setAccessGranted(true);
        
      } catch (profileError) {
        console.error('Profile check error:', profileError);
        
        if (requireApproval) {
          setRedirectTo('/pending-approval');
        } else {
          setAccessGranted(true);
        }
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setAccessGranted(false);
      setRedirectTo('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!accessGranted) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;