import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RefundsPage() {
  return (
    <AppShell>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Refund / Cancel Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" placeholder="e.g. Science Fair Model" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you’re requesting a refund/cancellation..."
              className="min-h-32"
            />
          </div>
          <Button className="w-fit">Submit request</Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
