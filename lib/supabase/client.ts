import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

// Demo accounts for instant testing
export const demoAccounts = {
  'parent@demo.com': { id: 'parent-1', email: 'parent@demo.com', role: 'parent', name: 'Sarah Johnson (Parent)' },
  'student@demo.com': { id: 'student-1', email: 'student@demo.com', role: 'student', name: 'Alex Johnson (Student)' },
  'builder@demo.com': { id: 'builder-1', email: 'builder@demo.com', role: 'builder', name: 'Mike Builder (Pro)' }
}

function setAuthCookies(user: any, token: string) {
  if (typeof window === 'undefined') return
  const maxAge = 86400 * 7 // 7 days
  document.cookie = `sb-auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `auth-role=${user.user_metadata?.role || 'parent'}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `auth-email=${encodeURIComponent(user.email)}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `demo-user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; SameSite=Lax`
  
  sessionStorage.setItem('jwt-token', token)
  sessionStorage.setItem('demo-user', JSON.stringify(user))
  localStorage.setItem('jwt-token', token)
  localStorage.setItem('demo-user', JSON.stringify(user))
}

function clearAuthCookies() {
  if (typeof window === 'undefined') return
  document.cookie = `sb-auth-token=; path=/; max-age=0`
  document.cookie = `auth-role=; path=/; max-age=0`
  document.cookie = `auth-email=; path=/; max-age=0`
  document.cookie = `demo-user=; path=/; max-age=0`
  
  sessionStorage.removeItem('jwt-token')
  sessionStorage.removeItem('demo-user')
  localStorage.removeItem('jwt-token')
  localStorage.removeItem('demo-user')
}

function createMockToken(user: any) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'parent',
  }
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `mock.${encodedPayload}`
}

// Mock client for robust local development & fallback
const createMockClient = () => ({
  auth: {
    getUser: async () => {
      let currentUser: any = null
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('demo-user') || localStorage.getItem('demo-user')
        if (stored) {
          try { currentUser = JSON.parse(stored) } catch {}
        }
      }
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
    getSession: async () => {
      let currentUser: any = null
      let token = 'mock-jwt-token'
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('demo-user') || localStorage.getItem('demo-user')
        if (stored) {
          try { currentUser = JSON.parse(stored) } catch {}
        }
        token = sessionStorage.getItem('jwt-token') || localStorage.getItem('jwt-token') || token
      }
      
      const user = currentUser || {
        id: 'parent-1',
        email: 'parent@demo.com',
        user_metadata: { role: 'parent', name: 'Sarah Johnson' }
      }

      return {
        data: {
          session: {
            access_token: token,
            token_type: 'bearer',
            user
          }
        },
        error: null
      }
    },
    signUp: async (credentials: any) => {
      const role = credentials.options?.data?.role || 'parent'
      const name = credentials.options?.data?.name || credentials.email.split('@')[0]
      const user = {
        id: `${role}-${Date.now()}`,
        email: credentials.email,
        user_metadata: { role, name }
      }
      const token = createMockToken(user)

      // Synchronize with FastAPI backend database
      try {
        if (role === 'parent') {
          await fetch('/api/backend/parents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, name })
          })
        } else if (role === 'student') {
          await fetch('/api/backend/students/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, name, grade: 'College' })
          })
        } else if (role === 'builder') {
          await fetch('/api/backend/builders/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, name })
          })
        }
      } catch (err) {
        console.warn('Notice: Backend register sync returned:', err)
      }

      setAuthCookies(user, token)

      return { 
        data: { 
          user,
          session: {
            access_token: token,
            token_type: 'bearer',
            user
          }
        }, 
        error: null 
      }
    },
    signInWithPassword: async (credentials: any) => {
      const email = (credentials.email || '').toLowerCase().trim()
      let demoUser = demoAccounts[email as keyof typeof demoAccounts]
      let userRole = credentials.role || (demoUser ? demoUser.role : 'parent')
      
      const user = demoUser ? {
        id: demoUser.id,
        email: demoUser.email,
        user_metadata: { role: demoUser.role, name: demoUser.name }
      } : {
        id: `${userRole}-${Date.now()}`,
        email,
        user_metadata: { role: userRole, name: email.split('@')[0] }
      }

      const token = createMockToken(user)
      setAuthCookies(user, token)

      return { 
        data: { 
          user,
          session: {
            access_token: token,
            token_type: 'bearer',
            user
          }
        }, 
        error: null 
      }
    },
    updateUser: async (updates: any) => {
      let currentUser: any = null
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('demo-user') || localStorage.getItem('demo-user')
        if (stored) {
          try { currentUser = JSON.parse(stored) } catch {}
        }
      }
      const updatedUser = {
        ...(currentUser || {}),
        user_metadata: {
          ...(currentUser?.user_metadata || {}),
          ...updates.data
        }
      }
      setAuthCookies(updatedUser, sessionStorage.getItem('jwt-token') || 'jwt')
      return { data: { user: updatedUser }, error: null }
    },
    refreshSession: async () => {
      return { 
        data: { 
          session: { user: { id: 'mock-user-id' } } 
        }, 
        error: null 
      }
    },
    signOut: async () => {
      clearAuthCookies()
      return { error: null }
    },
    onAuthStateChange: (callback?: any) => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  }
} as any)

export function getSupabaseBrowser() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  const isUnusableUrl = 
    !url || 
    !key || 
    url === 'https://your-project-ref.supabase.co' || 
    key === 'your-anon-key-here'

  if (isUnusableUrl) {
    client = createMockClient()
    return client
  }

  try {
    client = createBrowserClient(url, key)
    return client
  } catch {
    client = createMockClient()
    return client
  }
}

export type AppRole = "parent" | "student" | "builder"
