"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"
import { SkeletonCard } from "@/components/skeleton-card"
import { EmptyState } from "@/components/empty-state"
import { CreditCard, ArrowUpRight, CheckCircle2, Clock, RefreshCw } from "lucide-react"

interface Transaction {
  id: number
  project_title: string
  child_name: string
  builder_name: string
  amount: number
  status: string
  date: string | null
}

export default function ParentPaymentsPage() {
  const [data, setData] = useState<{ total_spent: number; transactions: Transaction[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/payments/history/parent")
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
          <CheckCircle2 className="w-3.5 h-3.5" /> Released
        </span>
      )
    }
    if (s === "held" || s === "escrow funded") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> In Escrow
        </span>
      )
    }
    if (s === "refunded") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5" /> Refunded
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
    <RoleGuard allowedRoles={["parent"]}>
      <AppShell role="parent">
        <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl mb-1">Payment History</h1>
            <p className="text-muted-foreground text-sm">
              Track money spent on projects, including date, time, builder, and escrow status.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4">
              <SkeletonCard rows={2} />
              <SkeletonCard rows={4} />
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Total Money Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${(data?.total_spent || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all student projects</p>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data?.transactions?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Payments &amp; Escrow funds</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!data?.transactions || data.transactions.length === 0 ? (
                    <EmptyState
                      icon={<CreditCard className="w-8 h-8 text-muted-foreground" />}
                      title="No payments yet"
                      description="When you approve and fund a project request, transaction receipts will appear here."
                    />
                  ) : (
                    <div className="divide-y">
                      {data.transactions.map((tx) => (
                        <div key={tx.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-base flex items-center gap-2">
                              {tx.project_title}
                              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span>Student: <strong className="text-foreground font-medium">{tx.child_name}</strong></span>
                              <span>•</span>
                              <span>Builder: <strong className="text-foreground font-medium">{tx.builder_name}</strong></span>
                            </div>
                            {tx.date && (
                              <div className="text-xs text-muted-foreground">
                                Date &amp; Time: {new Date(tx.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4">
                            {getStatusBadge(tx.status)}
                            <div className="text-lg font-bold font-mono text-foreground">
                              ${tx.amount.toFixed(2)}
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
