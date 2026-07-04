'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const userRole = currentUser?.user_metadata?.role || 'parent' // Default to parent for mock

        setUser(currentUser || null)

        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate role-based login
          const roleRedirects: Record<string, string> = {
            parent: '/auth/parent',
            student: '/auth/student', 
            builder: '/auth/builder'
          }
          router.push(roleRedirects[userRole] || redirectTo)
          return
        }

        setAuthorized(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}

// Hook for getting current user
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setRole(session?.user?.user_metadata?.role ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setRole(session?.user?.user_metadata?.role ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, role }
}
