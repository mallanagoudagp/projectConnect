"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const isDisabled = loading || !email || !password

  async function onSubmit() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        role: 'student'
      })
      
      if (error) throw error

      if (data.user) {
        await supabase.auth.updateUser({ data: { role: 'student' } })
      }

      toast({ title: "Welcome back, Student!", description: "Signed in successfully." })
      router.push("/student/dashboard")
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            🎓 Student Login
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to submit requests and track your projects
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
          <Button className="w-full" disabled={isDisabled} onClick={onSubmit}>
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
