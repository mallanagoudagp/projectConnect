import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { demoNotifications } from "@/lib/demo-data"

export default function BuilderDashboardPage() {
  const notifications = demoNotifications.filter((n) => n.role === "builder")

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl grid gap-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-balance">Builder Dashboard</h1>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Progress</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Share project updates and photos with families.
              </p>
              <Link href="/builder/uploads">
                <Button className="w-full">
                  Upload Progress Photos
                </Button>
              </Link>
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
      </div>
    </main>
  )
}
