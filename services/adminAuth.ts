import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  permissions: string[];
  active: boolean;
  last_login?: string;
}

class AdminAuthService {
  private static instance: AdminAuthService;
  private currentAdmin: AdminUser | null = null;

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  async login(email: string, password: string): Promise<{ 
    success: boolean; 
    admin?: AdminUser; 
    error?: string 
  }> {
    try {
      console.log('🔐 Admin login attempt:', email);
      
      // Try the SIMPLE function
      const { data, error } = await supabase.rpc('admin_login_simple', {
        user_email: email,
        user_password: password
      });

      console.log('Login RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      if (data && data.success && data.admin) {
        return this.handleSuccessfulLogin(data.admin);
      }

      if (data && !data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      // Last resort: Direct database query
      return await this.emergencyDirectLogin(email, password);
      
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  private handleSuccessfulLogin(adminData: any): { 
    success: boolean; 
    admin?: AdminUser; 
    error?: string 
  } {
    const adminUser: AdminUser = {
      id: adminData.id,
      email: adminData.email,
      full_name: adminData.full_name,
      permissions: adminData.permissions || [],
      active: adminData.active !== false,
      last_login: new Date().toISOString()
    };
    
    this.currentAdmin = adminUser;
    localStorage.setItem('admin_session', JSON.stringify({
      admin: adminUser,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    }));
    
    console.log('✅ Admin login successful:', adminUser.email);
    return { success: true, admin: adminUser };
  }

  private async emergencyDirectLogin(email: string, password: string): Promise<{ 
    success: boolean; 
    admin?: AdminUser; 
    error?: string 
  }> {
    try {
      console.log('🚨 Using emergency direct login...');
      
      // Direct query to admin_users table
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', email); // Case-insensitive search
      
      console.log('Direct query result:', { admins, error });
      
      if (error || !admins || admins.length === 0) {
        return {
          success: false,
          error: 'No admin account found with this email'
        };
      }
      
      const admin = admins[0];
      
      // Check if active
      if (!admin.active) {
        return {
          success: false,
          error: 'Admin account is inactive'
        };
      }
      
      // Hash password for comparison
      const hash = await this.hashPassword(password);
      console.log('Password comparison:', {
        input_hash_preview: hash.substring(0, 20),
        stored_hash_preview: admin.password_hash?.substring(0, 20)
      });
      
      if (admin.password_hash !== hash) {
        return {
          success: false,
          error: 'Password incorrect'
        };
      }
      
      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);
      
      const adminUser: AdminUser = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        permissions: admin.permissions || [],
        active: admin.active,
        last_login: new Date().toISOString()
      };
      
      this.currentAdmin = adminUser;
      localStorage.setItem('admin_session', JSON.stringify({
        admin: adminUser,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }));
      
      return { success: true, admin: adminUser };
      
    } catch (error: any) {
      console.error('Emergency login failed:', error);
      return {
        success: false,
        error: 'Emergency login failed: ' + error.message
      };
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Create SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Test function
  async testConnection() {
    console.log('🧪 Testing admin connection...');
    
    try {
      // Test 1: Direct table access
      const { data: tableData, error: tableError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      console.log('Table access test:', { tableData, tableError });
      
      // Test 2: RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_login_simple', {
        user_email: 'admin@gkbc.com',
        user_password: 'Admin123!'
      });
      
      console.log('RPC function test:', { rpcData, rpcError });
      
      return { tableTest: !tableError, rpcTest: !rpcError };
      
    } catch (error) {
      console.error('Test failed:', error);
      return { tableTest: false, rpcTest: false, error };
    }
  }

  // Rest of the methods remain the same...
  async logout(): Promise<void> {
    localStorage.removeItem('admin_session');
    this.currentAdmin = null;
  }

  async getCurrentAdmin(): Promise<AdminUser | null> {
    if (this.currentAdmin) return this.currentAdmin;
    
    const sessionStr = localStorage.getItem('admin_session');
    if (!sessionStr) return null;
    
    try {
      const session = JSON.parse(sessionStr);
      if (new Date(session.expires_at) < new Date()) {
        await this.logout();
        return null;
      }
      this.currentAdmin = session.admin;
      return this.currentAdmin;
    } catch {
      await this.logout();
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const admin = await this.getCurrentAdmin();
    return !!admin && admin.active;
  }
}

export const adminAuth = AdminAuthService.getInstance();