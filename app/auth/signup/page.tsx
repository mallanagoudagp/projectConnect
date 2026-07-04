"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleSelect } from "@/components/role-select"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [role, setRole] = useState<"parent" | "student" | "builder">("parent")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, name },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })
      if (error) throw error

      // If your project allows immediate sessions, route directly
      if (data?.session && data?.user) {
        try {
          await supabase.auth.refreshSession()
          if (!data.user.user_metadata?.role) {
            await supabase.auth.updateUser({ data: { role, name } })
          }
        } catch {}

        // compute redirect on server for consistency
        const res = await fetch("/api/auth/redirect", { cache: "no-store" })
        const json = (await res.json()) as { dest?: string }
        const dest =
          json?.dest ||
          (role === "builder" ? "/builder/dashboard" : role === "student" ? "/student/dashboard" : "/parent/dashboard")

        window.location.assign(dest)
        return
      }

      // Otherwise, email confirmation flow
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to verify your account.",
      })
      router.replace(`/auth/login?email=${encodeURIComponent(email)}`)
    } catch (e: any) {
      toast({ title: "Sign-up failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <CardHeader>
          <CardTitle className="text-center">Create your BuildTrack account</CardTitle>
          <CardDescription className="text-center">Select your role to tailor your experience</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RoleSelect value={role} onChange={setRole} />
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
          <Button className="w-full" disabled={loading} onClick={onSubmit}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline hover:text-foreground" href="/auth/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
