import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold">Subscription & Profile</h1>
          <p className="text-muted-foreground">Manage your plan, billing, and personal details.</p>
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
                <Input id="name" placeholder="Jane Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <Button className="w-fit">Save changes</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
