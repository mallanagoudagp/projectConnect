"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function BuilderDashboardPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  // Auth guard: redirect unauthenticated users to login;
  // redirect wrong-role users to their correct dashboard
  // (same mapping as app/api/auth/redirect/route.ts)
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
    } else if (role !== "builder") {
      const dest =
        role === "student" ? "/student/dashboard" : "/parent/dashboard"
      router.replace(dest)
    }
  }, [authLoading, user, role, router])

  // Fetch dashboard once we have the logged-in builder's email
  useEffect(() => {
    if (authLoading || !user?.email) return

    apiFetch(`/dashboards/builder?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        setData(data)
        if (data.builder?.id) {
          apiFetch(`/builders/${data.builder.id}/analytics`)
            .then(r => r.json())
            .then(a => setAnalytics(a))
            .catch(console.error)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [authLoading, user])

  if (loading) {
    return (
      <RoleGuard allowedRoles={["builder"]}>
        <AppShell role="builder">
          <div className="p-8">Loading dashboard...</div>
        </AppShell>
      </RoleGuard>
    )
  }

  const projects = data?.projects || []
  const builder = data?.builder || {}

  return (
    <RoleGuard allowedRoles={["builder"]}>
      <AppShell role="builder">
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-5xl grid gap-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-balance">
              Builder Dashboard - Welcome {builder.name}!
            </h1>

            <section className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Projects</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-none last:pb-0">
                      <div>
                        <span className="text-sm font-semibold">Student: {p.child_name}</span>
                        <div className="text-xs text-muted-foreground">Progress: {p.progress}%</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium">{p.status}</span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/workspace/${p.id}`}>Open Workspace</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && <p className="text-sm text-muted-foreground">No assigned projects yet.</p>}
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Share images and videos to keep parents and students up to date.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/builder/uploads">Go to Uploads</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Builder Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-semibold text-yellow-500">⭐ {builder.rating} / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-muted-foreground">Active Students</span>
                    <span className="font-semibold">{projects.length}</span>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Recent Notifications</h4>
                    <p className="text-sm text-muted-foreground">No recent notifications.</p>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            {/* Analytics Section */}
            {analytics && (
              <section className="grid gap-6 mt-6">
                <h2 className="text-xl font-semibold">Analytics & Earnings</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${analytics.total_earnings.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.average_rating} ⭐</div>
                      <div className="text-xs text-muted-foreground">{analytics.total_reviews} reviews</div>
                    </CardContent>
                  </Card>
                </div>

                <h2 className="text-xl font-semibold mt-4">Recent Reviews</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {analytics.recent_reviews?.length > 0 ? (
                    analytics.recent_reviews.map((r: any) => (
                      <Card key={r.id}>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-base">{r.parent_name}</CardTitle>
                          <div className="text-sm font-bold">{r.rating} ⭐</div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{r.comment}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                  )}
                </div>
              </section>
            )}

          </div>
        </main>
      </AppShell>
    </RoleGuard>
  )
}
