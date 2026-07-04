import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

// Demo accounts for testing
const demoAccounts = {
  'parent@demo.com': { id: 'parent-1', email: 'parent@demo.com', role: 'parent', name: 'Sarah Johnson' },
  'student@demo.com': { id: 'student-1', email: 'student@demo.com', role: 'student', name: 'Alex Johnson' },
  'builder@demo.com': { id: 'builder-1', email: 'builder@demo.com', role: 'builder', name: 'Mike Builder' }
}

// Mock client for development when Supabase is not configured
const createMockClient = () => ({
  auth: {
    getUser: async () => {
      // Get current user from sessionStorage if available
      const currentUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('demo-user') || 'null') : null
      return { 
        data: { 
          user: currentUser || { 
            id: 'parent-1', 
            email: 'parent@demo.com',
            user_metadata: { role: 'parent', name: 'Sarah Johnson' }
          } 
        }, 
        error: null 
      }
    },
    signUp: async (credentials: any) => {
      const role = credentials.options?.data?.role || 'parent'
      const name = credentials.email.split('@')[0]
      const user = {
        id: `${role}-new`,
        email: credentials.email,
        user_metadata: { role, name }
      }
      
      try {
        const res = await fetch('http://localhost:8000/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, role, name, supabase_user_id: user.id })
        })
        const data = await res.json()
        if (res.ok && typeof window !== 'undefined') {
          sessionStorage.setItem('jwt-token', data.token)
          sessionStorage.setItem('demo-user', JSON.stringify(user))
        }
      } catch (e) {
        console.error(e)
      }

      return { 
        data: { user }, 
        error: null 
      }
    },
    signInWithPassword: async (credentials: any) => {
      let userRole = credentials.role || 'parent'
      let demoUser = demoAccounts[credentials.email as keyof typeof demoAccounts]
      
      let user = demoUser ? {
        id: demoUser.id,
        email: demoUser.email,
        user_metadata: { role: demoUser.role, name: demoUser.name }
      } : {
        id: `${userRole}-user`,
        email: credentials.email,
        user_metadata: { role: userRole, name: credentials.email.split('@')[0] }
      }

      try {
        const res = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, role: user.user_metadata.role, supabase_user_id: user.id })
        })
        const data = await res.json()
        if (res.ok && typeof window !== 'undefined') {
          sessionStorage.setItem('jwt-token', data.token)
          sessionStorage.setItem('demo-user', JSON.stringify(user))
        }
      } catch (e) {
        console.error(e)
      }

      return { data: { user }, error: null }
    },
    updateUser: async (updates: any) => {
      // Simulate user update
      return { 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: 'demo@example.com',
            user_metadata: { ...updates.data }
          } 
        }, 
        error: null 
      }
    },
    refreshSession: async () => {
      // Simulate session refresh
      return { 
        data: { 
          session: { user: { id: 'mock-user-id' } } 
        }, 
        error: null 
      }
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('demo-user')
      }
      return { error: null }
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
} as any)

export function getSupabaseBrowser() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key || url === 'https://your-project-ref.supabase.co' || key === 'your-anon-key-here') {
    console.warn('Supabase not configured, using mock client for development')
    client = createMockClient()
    return client
  }

  client = createBrowserClient(url, key)
  return client
}

export type AppRole = "parent" | "student" | "builder"
