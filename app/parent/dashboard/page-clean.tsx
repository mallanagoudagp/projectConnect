"use client"

import { AppShell } from "@/components/app-shell"
import { Timeline } from "@/components/timeline"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { demoNotifications, demoProjects } from "@/lib/demo-data"

export default function ParentDashboard() {
  const project = demoProjects[0]
  const notifications = demoNotifications.filter((n) => n.role === "parent")

  return (
    <AppShell role="parent">
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold text-balance">👪 Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor student projects and builder updates at a glance.</p>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Project</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-muted-foreground">Current Status: {project.status}</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <Timeline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Project Budget & Payments</h2>
          <Card>
            <CardHeader>
              <CardTitle>{project.name} - Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">${project.budget}</div>
                  <div className="text-sm text-muted-foreground">Total Budget</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">${project.spent}</div>
                  <div className="text-sm text-muted-foreground">Spent</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">${Math.max(0, project.budget - project.spent)}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{Math.round((project.spent / project.budget) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Used</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Total budget</span>
                  <span className="text-muted-foreground">${project.budget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Paid to date</span>
                  <span className="text-muted-foreground">${project.spent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining</span>
                  <span className="text-muted-foreground">${Math.max(0, project.budget - project.spent)}</span>
                </div>
                <Badge className="w-fit mt-2">Milestone: {project.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
