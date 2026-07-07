"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function StudentDashboard() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Auth guard: redirect unauthenticated users to login;
  // redirect wrong-role users to their correct dashboard
  // (same mapping as app/api/auth/redirect/route.ts)
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
    } else if (role !== "student") {
      const dest =
        role === "builder" ? "/builder/dashboard" : "/parent/dashboard"
      router.replace(dest)
    }
  }, [authLoading, user, role, router])

  // Fetch dashboard once we have the logged-in student's email
  useEffect(() => {
    if (authLoading || !user?.email) return

    apiFetch(`/dashboards/child?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <RoleGuard allowedRoles={["student"]}>
        <AppShell role="student">
          <div className="p-8">Loading dashboard...</div>
        </AppShell>
      </RoleGuard>
    )
  }

  const active = data?.projects || []
  const notifications = data?.notifications || []

  return (
    <RoleGuard allowedRoles={["student"]}>
      <AppShell role="student">
        <div className="grid gap-6">
          <section className="grid gap-2">
            <h1 className="text-2xl font-semibold text-balance">Student Dashboard</h1>
            <p className="text-muted-foreground">Request help, upload materials, and track progress.</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Start a new request</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Describe your project, budget, and timeline. Verified builders will respond with offers.
                </p>
                <Button asChild>
                  <Link href="/student/requests/new">Create request</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your active requests</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {active.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-md mb-2">
                    <div>
                      <div className="font-semibold">{r.service_name}</div>
                      <div className="text-xs text-muted-foreground">Builder: {r.builder_name}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-muted-foreground block">{r.status}</span>
                        <span className="text-xs font-medium">{r.progress}% done</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workspace/${r.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {active.length === 0 && <p className="text-sm text-muted-foreground">No active requests yet.</p>}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {notifications.map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between">
                    <span>{n.message}</span>
                    <span className="text-muted-foreground">{n.createdAt}</span>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
              </CardContent>
            </Card>
          </section>
        </div>
      </AppShell>
    </RoleGuard>
  )
}
