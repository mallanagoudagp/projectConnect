import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Mock server client for development when Supabase is not configured
const createMockServerClient = () => ({
  auth: {
    getUser: async () => ({ 
      data: { 
        user: { 
          id: 'mock-user-id', 
          email: 'demo@example.com',
          user_metadata: { role: 'parent' }
        } 
      }, 
      error: null 
    })
  }
} as any)

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'https://your-project-ref.supabase.co' || key === 'your-anon-key-here') {
    console.warn('Supabase not configured, using mock server client for development')
    return createMockServerClient()
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}
