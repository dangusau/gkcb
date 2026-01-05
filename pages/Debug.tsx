import React, { useEffect, useState } from 'react'
import { supabase, testConnection } from '../services/supabase'

const Debug = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const runTests = async () => {
    addLog('Starting connection tests...')
    
    // Test environment variables
    addLog(`VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`)
    addLog(`VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`)
    
    // Test connection
    const status = await testConnection()
    setConnectionStatus(status)
    addLog(`Auth connection: ${status.auth ? 'OK' : 'FAILED'}`)
    addLog(`DB connection: ${status.db ? 'OK' : 'FAILED'}`)
    
    // Test signup with dummy data
    addLog('Testing signup with dummy data...')
    try {
      const testEmail = `test${Date.now()}@test.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User',
            phone: '1234567890'
          }
        }
      })
      
      if (error) {
        addLog(`Signup failed: ${error.message}`)
        addLog(`Error details: ${JSON.stringify(error)}`)
      } else {
        addLog(`Signup successful! User ID: ${data.user?.id}`)
        
        // Try to insert profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: testEmail,
              first_name: 'Test',
              last_name: 'User',
              phone: '1234567890',
              approval_status: 'pending',
              role: 'member'
            })
            
          if (profileError) {
            addLog(`Profile creation failed: ${profileError.message}`)
            addLog(`Profile error details: ${JSON.stringify(profileError)}`)
            addLog(`Hint: ${profileError.hint || 'No hint available'}`)
            addLog(`Details: ${profileError.details || 'No details available'}`)
          } else {
            addLog('Profile creation successful!')
          }
        }
      }
    } catch (error: any) {
      addLog(`Test signup error: ${error.message}`)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Console</h1>
      
      <button
        onClick={runTests}
        className="mb-6 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Run Tests Again
      </button>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <pre className="text-sm">
          {JSON.stringify(connectionStatus, null, 2)}
        </pre>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="border-b border-gray-700 pb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Debug