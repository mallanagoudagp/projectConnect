"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchDashboard = async () => {
    try {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || "parent@demo.com"
      
      const res = await fetch(`http://localhost:8000/dashboards/parent?email=${email}`)
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending_approvals || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handlePayAndApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setIsPaying(true)
    
    try {
      const res = await fetch(`http://localhost:8000/escrow/${selectedProject.id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_token: "tok_mock_visa" })
      })
      
      if (res.ok) {
        toast({ title: "Payment Successful", description: "Project approved and funds held in escrow!" })
        setSelectedProject(null)
        // Refresh the pending list
        fetchDashboard()
        // Optional: Route them to the new workspace
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
            {loading ? (
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
                    <Button onClick={() => setSelectedProject(p)}>Review & Pay</Button>
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
              <DialogTitle>Fund Escrow & Approve</DialogTitle>
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
