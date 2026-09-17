"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if access token exists in URL hash from Supabase password recovery email
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      const supabase = getSupabaseBrowser()
      supabase.auth.onAuthStateChange(async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          toast({ title: "Session verified", description: "Please enter your new password below." })
        }
      })
    }
  }, [toast])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      toast({ title: "Password required", description: "Please enter a new password.", variant: "destructive" })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please ensure both password fields match.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast({ title: "Password updated successfully!", description: "You can now sign in with your new password." })
      router.push("/auth/login")
    } catch (err: any) {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center mb-8 text-2xl text-primary hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
        >
          BuildTrack
        </Link>
        <Card className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>Enter your new password below to update your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
