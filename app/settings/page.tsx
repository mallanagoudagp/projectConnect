"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { LogOut } from "lucide-react"

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)

  // Pre-fill with logged-in user's details
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name ?? "")
      setEmail(user.email ?? "")
    }
  }, [user])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.updateUser({
        email: email !== user?.email ? email : undefined,
        data: { name },
      })
      if (error) throw error
      toast({ title: "Profile updated", description: "Your changes have been saved." })
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="flex items-center justify-between">
          <div className="grid gap-1">
            <h1 className="text-2xl font-semibold">Subscription &amp; Profile</h1>
            <p className="text-muted-foreground">Manage your plan, billing, and personal details.</p>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Basic tracking, limited uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                Current Plan
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Unlimited uploads, priority support</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Upgrade</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <CardDescription>Manage multiple students</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Upgrade</Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button className="w-fit" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
