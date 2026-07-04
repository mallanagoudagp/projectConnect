import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
  const items = [
    { id: 1, text: "Builder uploaded 2 new images.", role: "parent" },
    { id: 2, text: "Payment released to builder.", role: "builder" },
    { id: 3, text: "Your request received 3 offers.", role: "student" },
  ]
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {items.map((n) => (
            <div key={n.id} className="flex items-center justify-between">
              <span>{n.text}</span>
              <Badge variant="secondary">{n.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  )
}
