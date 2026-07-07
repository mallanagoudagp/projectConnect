"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [pending, setPending] = useState<any[]>([])
  const [refundRequests, setRefundRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refundsLoading, setRefundsLoading] = useState(true)

  const fetchPending = () => {
    setLoading(true)
    apiFetch(`/builders/pending`)
      .then(res => res.json())
      .then(data => {
        setPending(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  // Fetch all projects with escrow status 'refund_requested'
  const fetchRefundRequests = () => {
    setRefundsLoading(true)
    apiFetch(`/escrow/refund-requests`)
      .then(res => res.json())
      .then(data => {
        setRefundRequests(data)
        setRefundsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setRefundsLoading(false)
      })
  }

  useEffect(() => {
    fetchPending()
    fetchRefundRequests()
  }, [])

  const handleApproveBuilder = async (id: number) => {
    try {
      const res = await apiFetch(`/builders/${id}/verify`, {
        method: "POST"
      })
      if (res.ok) {
        toast({ title: "Builder verified successfully!" })
        fetchPending()
      } else {
        toast({ title: "Error verifying builder", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleApproveRefund = async (projectId: number, amount: number) => {
    if (!confirm(`Approve refund of $${amount} to parent? This will execute the gateway refund.`)) return
    try {
      const res = await apiFetch(`/escrow/${projectId}/refund/admin-approve`, {
        method: "POST"
      })
      const result = await res.json()
      if (res.ok) {
        toast({
          title: "Refund Approved",
          description: `$${result.amount} refunded. ID: ${result.refund_id}`
        })
        fetchRefundRequests()
      } else {
        toast({ title: "Refund Failed", description: result.detail || "Error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto max-w-4xl grid gap-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform verifications and approvals.</p>
        </div>

        {/* Pending Refund Requests — disputed projects where builder has done work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Refund Requests
              {refundRequests.length > 0 && (
                <Badge variant="destructive">{refundRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {refundsLoading ? (
              <p>Loading...</p>
            ) : refundRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending refund requests.</p>
            ) : (
              refundRequests.map((r: any) => (
                <div key={r.project_id} className="flex flex-col md:flex-row md:items-center justify-between border border-destructive/30 rounded-md p-4 gap-4 bg-card">
                  <div>
                    <h3 className="font-semibold text-lg">Project #{r.project_id} — {r.service_name}</h3>
                    <p className="text-sm text-muted-foreground">Builder progress: {r.progress}%</p>
                    <p className="text-sm text-muted-foreground">Escrow amount: <span className="font-semibold">${r.amount}</span></p>
                    <p className="text-sm text-muted-foreground">Status: <Badge variant="destructive">REFUND REQUESTED</Badge></p>
                  </div>
                  <div>
                    <Button variant="destructive" onClick={() => handleApproveRefund(r.project_id, r.amount)}>
                      Approve Refund
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Builder Verifications */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Builder Verifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loading ? (
              <p>Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending builders at this time.</p>
            ) : (
              pending.map(b => (
                <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-md p-4 gap-4 bg-card">
                  <div>
                    <h3 className="font-semibold text-lg">{b.name} <Badge variant="secondary">Pending</Badge></h3>
                    <p className="text-sm text-muted-foreground mb-2">Email: {b.email}</p>
                    <p className="text-sm mb-2 max-w-xl">{b.blurb}</p>
                    <div className="flex gap-2 text-xs">
                      {b.categories.map((c: string) => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Button onClick={() => handleApproveBuilder(b.id)}>Approve Builder</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
