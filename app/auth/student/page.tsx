"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SimpleStudentLogin() {
  const [email, setEmail] = useState("student@demo.com")
  const [password, setPassword] = useState("password")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      })
      
      if (error) {
        console.error('Login error:', error)
      } else {
        router.push("/student/dashboard")
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            🎓 Student Login
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to submit requests, track project progress, and collaborate with builders
          </CardDescription>
          <div className="flex justify-center">
            <Badge variant="secondary">Student Account</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={loading} onClick={handleLogin}>
            {loading ? "Signing in..." : "Sign In as Student"}
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No student account?{" "}
              <Link className="underline hover:text-foreground" href="/auth/signup?role=student">
                Create one
              </Link>
            </p>
            <div className="flex justify-center gap-2 text-xs text-muted-foreground">
              <Link href="/auth/parent" className="hover:underline">Parent Login</Link>
              <span>•</span>
              <Link href="/auth/builder" className="hover:underline">Builder Login</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
