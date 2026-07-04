"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPending = () => {
    setLoading(true)
    fetch('http://localhost:8000/builders/pending')
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

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/builders/${id}/verify`, {
        method: "POST"
      })
      if (res.ok) {
        alert("Builder verified successfully!")
        fetchPending()
      } else {
        alert("Error verifying builder")
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto max-w-4xl grid gap-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform verifications and approvals.</p>
        </div>

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
                    <Button onClick={() => handleApprove(b.id)}>Approve Builder</Button>
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
