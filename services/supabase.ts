import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase URL present:', !!supabaseUrl)
console.log('Supabase Key present:', !!supabaseAnonKey)

export const testConnection = async () => {
  console.log('Testing Supabase connection...')
  
  try {
    // Test 1: Check auth
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('Auth test:', authError ? 'Failed' : 'Success', authData)
    
    // Test 2: Check database access
    const { data: testData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    console.log('DB test:', dbError ? 'Failed' : 'Success', dbError?.message)
    
    return { auth: !authError, db: !dbError }
  } catch (error) {
    console.error('Connection test error:', error)
    return { auth: false, db: false }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

export const checkApprovalStatus = async (): Promise<'approved' | 'pending' | 'rejected' | 'error'> => {
  try {
    const profile = await getCurrentProfile()
    if (!profile) return 'error'
    return profile.approval_status as 'approved' | 'pending' | 'rejected'
  } catch (error) {
    console.error('Error checking approval status:', error)
    return 'error'
  }
}

// Admin functions
export const getPendingUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const approveUser = async (userId: string, adminId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      approval_status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
  
  return { data, error }
}

export const rejectUser = async (userId: string, adminId: string, reason: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      approval_status: 'rejected',
      approved_by: adminId,
      rejection_reason: reason,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
  
  return { data, error }
}

// Auth state listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Session helper
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}