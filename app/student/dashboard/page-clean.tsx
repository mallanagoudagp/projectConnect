import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { demoProjects, demoNotifications } from "@/lib/demo-data"

export default function StudentDashboard() {
  const notifications = demoNotifications.filter((n) => n.role === "student")
  const active = demoProjects.map((p) => ({
    name: p.name,
    status: p.progress === 0 ? "Awaiting approval" : p.progress < 100 ? "In progress" : "Completed",
  }))

  return (
    <AppShell role="student">
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold text-balance">Student Dashboard</h1>
          <p className="text-muted-foreground">Request help, upload materials, and track progress.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/student/requests">
                <Button className="w-full justify-start">
                  Submit Help Request
                </Button>
              </Link>
              <Link href="/uploads">
                <Button variant="outline" className="w-full justify-start">
                  Upload Materials
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {active.slice(0, 3).map((project, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.status}</p>
                  </div>
                </div>
              ))}
              {active.length === 0 && <p className="text-sm text-muted-foreground">No active projects yet.</p>}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {notifications.slice(0, 5).map((notification) => (
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
      </div>
    </AppShell>
  )
}
