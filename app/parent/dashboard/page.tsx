"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Timeline } from "@/components/timeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import Link from "next/link"

export default function ParentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For demo/testing, fetch the seeded parent
    fetch('http://localhost:8000/dashboards/parent?email=parent@demo.com')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <AppShell role="parent">
        <div className="p-8">Loading dashboard...</div>
      </AppShell>
    )
  }

  if (!data || !data.projects || data.projects.length === 0) {
    return (
      <AppShell role="parent">
        <div className="p-8">No active projects yet. Get started by approving a request!</div>
      </AppShell>
    )
  }

  const project = data.projects[0]
  const notifications = data.notifications || []

  return (
    <AppShell role="parent">
      <div className="grid gap-6">
          <section className="grid gap-2">
            <h1 className="text-2xl font-semibold text-balance">👪 Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor student projects and builder updates at a glance.</p>
          </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Project</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span>{project.service_name} (for {project.child_name})</span>
                <Badge variant="default">{project.status}</Badge>
              </div>
              <Progress value={project.progress} />
              <Timeline
                items={[
                  { label: "Submitted", status: "done" },
                  { label: "Approved", status: "done" },
                  { label: "In Build", status: project.progress > 0 && project.progress < 100 ? "current" : "todo" },
                  { label: "Delivery", status: project.progress === 100 ? "done" : "todo" },
                ]}
              />
              <div className="mt-4 pt-4 border-t text-center">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/workspace/${project.id}`}>Open Workspace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {notifications.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between text-sm">
                  <span>{n.message}</span>
                  <span className="text-muted-foreground">{n.createdAt}</span>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Builder Updates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <img src="/project-upload-photo-1.png" alt="Latest upload 1" className="w-full rounded-md border" />
                <img src="/project-upload-photo-2.png" alt="Latest upload 2" className="w-full rounded-md border" />
                <img src="/project-upload-photo-3.png" alt="Latest upload 3" className="w-full rounded-md border" />
                <img src="/project-upload-photo-4.png" alt="Latest upload 4" className="w-full rounded-md border" />
              </div>
              <div className="text-sm text-muted-foreground">
                Assigned Builder: {project.builder_name}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
