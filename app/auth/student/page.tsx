"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SimpleStudentLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
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
        const message = error.message === "Invalid login credentials"
          ? "The email or password is incorrect. Create a student account first if you have not signed up yet."
          : error.message === "Email not confirmed"
            ? "Confirm your email from the Supabase verification message before signing in."
            : error.message
        toast({ title: "Student sign-in failed", description: message, variant: "destructive" })
      } else {
        router.push("/student/dashboard")
      }
    } catch (error: any) {
      toast({ title: "Student sign-in failed", description: error?.message || "Unable to sign in.", variant: "destructive" })
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
