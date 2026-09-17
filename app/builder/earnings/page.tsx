"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"
import { SkeletonCard } from "@/components/skeleton-card"
import { EmptyState } from "@/components/empty-state"
import { DollarSign, CheckCircle2, Clock, User, ArrowDownLeft } from "lucide-react"

interface EarningsTransaction {
  id: number
  project_title: string
  student_name: string
  parent_name: string
  amount: number
  status: string
  date: string | null
}

export default function BuilderEarningsPage() {
  const [data, setData] = useState<{ total_earnings: number; transactions: EarningsTransaction[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/payments/history/builder")
      .then(res => res.json())
      .then(resData => {
        setData(resData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function getStatusBadge(status: string) {
    const s = status.toLowerCase()
    if (s === "released" || s === "completed") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Payout Released
        </span>
      )
    }
    if (s === "held" || s === "in escrow") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Escrow Held
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
        {status}
      </span>
    )
  }

  return (
    <RoleGuard allowedRoles={["builder"]}>
      <AppShell role="builder">
        <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl mb-1">Earnings &amp; Payout Log</h1>
            <p className="text-muted-foreground text-sm">
              Complete history of money collected from parents for student project requests.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4">
              <SkeletonCard rows={2} />
              <SkeletonCard rows={4} />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-700">${(data?.total_earnings || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Calculated from completed &amp; escrow jobs</p>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Paid Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data?.transactions?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total funded requests</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collected Payments Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {!data?.transactions || data.transactions.length === 0 ? (
                    <EmptyState
                      icon={<DollarSign className="w-8 h-8 text-muted-foreground" />}
                      title="No earnings recorded yet"
                      description="Once parents fund or approve your projects, your earnings breakdown will display here."
                    />
                  ) : (
                    <div className="divide-y">
                      {data.transactions.map((tx) => (
                        <div key={tx.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-base flex items-center gap-2">
                              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                              {tx.project_title}
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span>Student: <strong className="text-foreground font-medium">{tx.student_name}</strong></span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" /> Paid by Parent: <strong className="text-foreground font-medium">{tx.parent_name}</strong>
                              </span>
                            </div>
                            {tx.date && (
                              <div className="text-xs text-muted-foreground">
                                Received on: {new Date(tx.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4">
                            {getStatusBadge(tx.status)}
                            <div className="text-lg font-bold font-mono text-emerald-700">
                              +${tx.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </AppShell>
    </RoleGuard>
  )
}
