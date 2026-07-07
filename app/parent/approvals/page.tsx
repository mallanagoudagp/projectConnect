"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function ApprovalsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const { toast } = useToast()

  // Auth guard: redirect unauthenticated users to login;
  // redirect wrong-role users to their correct dashboard
  // (same mapping as app/api/auth/redirect/route.ts)
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
    } else if (role !== "parent") {
      const dest =
        role === "builder" ? "/builder/dashboard" : "/student/dashboard"
      router.replace(dest)
    }
  }, [authLoading, user, role, router])

  // Fetch pending approvals once we have the logged-in parent's email
  useEffect(() => {
    if (authLoading || !user?.email) return

    apiFetch(`/dashboards/parent?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        setPending(data.pending_approvals || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [authLoading, user])

  const handlePayAndApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setIsPaying(true)

    try {
      const res = await apiFetch(`/escrow/${selectedProject.id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_token: "tok_mock_visa" })
      })

      if (res.ok) {
        toast({ title: "Payment Successful", description: "Project approved and funds held in escrow!" })
        setSelectedProject(null)
        // Refresh the pending list
        if (user?.email) {
          apiFetch(`/dashboards/parent?email=${encodeURIComponent(user.email)}`)
            .then(r => r.json())
            .then(data => setPending(data.pending_approvals || []))
            .catch(console.error)
        }
        // Route them to the new workspace
        router.push(`/workspace/${selectedProject.id}`)
      } else {
        const err = await res.json()
        toast({ title: "Payment Failed", description: err.detail || "Error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <AppShell role="parent">
      <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground mt-2">Approve and fund project requests from your students.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Requests</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {authLoading || loading ? (
              <p>Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests at this time.</p>
            ) : (
              pending.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-md p-4 bg-card gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{p.service_name}</h3>
                    <p className="text-sm text-muted-foreground">Student: {p.child_name}</p>
                    <p className="text-sm text-muted-foreground">Assigned Builder: {p.builder_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">${p.price}</span>
                    <Button onClick={() => setSelectedProject(p)}>Review &amp; Pay</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Modal */}
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fund Escrow &amp; Approve</DialogTitle>
              <DialogDescription>
                You are approving <strong>{selectedProject?.service_name}</strong> for {selectedProject?.child_name}.
                The total amount of <strong>${selectedProject?.price}</strong> will be held in Escrow and released to the Builder only when the project is 100% complete.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayAndApprove} className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label>Card Number (Mock)</Label>
                <Input defaultValue="4242 4242 4242 4242" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Expiry</Label>
                  <Input defaultValue="12/26" readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>CVC</Label>
                  <Input defaultValue="123" readOnly />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isPaying}>
                {isPaying ? "Processing..." : `Pay $${selectedProject?.price}`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </AppShell>
  )
}
