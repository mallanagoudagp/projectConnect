"use client"

import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Bell, Calendar, CheckCircle2, Clock, DollarSign, ExternalLink, Loader2, Plus, RefreshCw, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  "Pending Parent Approval": { color: "bt-badge-approval", dot: "bg-amber-400", label: "Pending Approval" },
  "Pending Builder Acceptance": { color: "bt-badge-pending", dot: "bg-blue-400", label: "With Builder" },
  "Pending Final Parent Approval": { color: "bt-badge-quote", dot: "bg-purple-400", label: "Quote Ready" },
  "In Progress": { color: "bt-badge-progress", dot: "bg-emerald-400", label: "In Progress" },
  "Approved": { color: "bt-badge-progress", dot: "bg-emerald-400", label: "Approved" },
  "Completed": { color: "bt-badge-completed", dot: "bg-green-500", label: "Completed" },
  "Delivered": { color: "bt-badge-completed", dot: "bg-green-500", label: "Delivered" },
  "Declined": { color: "bt-badge-declined", dot: "bg-gray-400", label: "Declined" },
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/auth/login") }
    else if (role !== "student") {
      router.replace(role === "builder" ? "/builder/dashboard" : "/parent/dashboard")
    }
  }, [authLoading, user, role, router])

  async function fetchDashboard() {
    if (!user?.email) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    try {
      setError(null)
      const res = await apiFetch(`/dashboards/child?email=${encodeURIComponent(user.email)}`, { signal: controller.signal })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.detail || `Could not load dashboard (${res.status})`)
      setData(body)
    } catch (err: any) {
      setError(err.name === "AbortError" ? "The dashboard request timed out. Check that the backend is running." : err.message)
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user?.email) return
    fetchDashboard()
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <RoleGuard allowedRoles={["student"]}>
        <AppShell role="student" showAuthActions>
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading dashboard…</p>
            </div>
          </div>
        </AppShell>
      </RoleGuard>
    )
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={["student"]}>
        <AppShell role="student" showAuthActions>
          <div className="flex items-center justify-center py-20">
            <div className="max-w-md text-center space-y-4">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="text-lg font-semibold">Could not load your dashboard</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={() => { setLoading(true); fetchDashboard() }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </AppShell>
      </RoleGuard>
    )
  }

  const allProjects = data?.projects || []
  const completedProjects = allProjects.filter((r: any) => r.status === "Completed" || r.status === "Delivered")
  const rejectedProjects = allProjects.filter((r: any) => ["Declined", "Rejected", "Rejected by Builder"].includes(r.status))
  const active = allProjects.filter((r: any) =>
    !["Completed", "Delivered", "Declined", "Rejected", "Rejected by Builder"].includes(r.status)
  )
  const notifications = data?.notifications || []
  const inProgress = active.filter((r: any) => r.status === "In Progress" || r.status === "Approved").length
  const completed = completedProjects.length

  // Get student first name
  const firstName = data?.child?.name?.split(" ")[0] || user?.user_metadata?.name?.split(" ")[0] || "there"

  return (
    <RoleGuard allowedRoles={["student"]}>
      <AppShell role="student" showAuthActions>
        <div className="space-y-6">
          {/* ── HEADER ── */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hey, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your projects, compare progress, and request new builds from verified builders.
            </p>
          </div>

          {/* ── STAT STRIP ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Requests", value: allProjects.length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: TrendingUp },
              { label: "In Progress", value: inProgress, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: Clock },
              { label: "Completed", value: completed, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", icon: CheckCircle2 },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4 bt-stat-card">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
                </div>
              )
            })}
          </div>

          {/* ── TWO-COLUMN MAIN ── */}
          <div className="grid gap-6 md:grid-cols-5">
            {/* CREATE REQUEST — left column */}
            <div className="md:col-span-2">
              <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden h-full flex flex-col justify-between">
                {/* BG decoration */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">
                  <div className="text-3xl mb-3">✨</div>
                  <h2 className="text-lg font-bold mb-2">Start a New Request</h2>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Describe your project, budget, and timeline. Verified builders will respond with offers.
                  </p>
                </div>

                <div className="relative mt-6">
                  <Link
                    href="/student/requests/new"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-primary font-semibold text-sm rounded-xl hover:bg-blue-50 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Create Request
                  </Link>
                  <p className="text-xs text-blue-200 text-center mt-2">Your parent will be notified to approve it.</p>
                </div>
              </div>
            </div>

            {/* ACTIVE REQUESTS — right column */}
            <div className="md:col-span-3">
              <div className="bg-card border border-border rounded-2xl overflow-hidden h-full">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-sm">
                    Your Active Requests
                    <span className="ml-2 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">{active.length}</span>
                  </h2>
                  <Link href="/student/requests/new" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {active.length === 0 ? (
                    <div className="py-12 text-center px-4">
                      <div className="text-3xl mb-2">📂</div>
                      <p className="text-sm font-medium">No active requests</p>
                      <p className="text-xs text-muted-foreground mt-1">Create your first request to get started.</p>
                    </div>
                  ) : (
                    active.map((r: any, i: number) => {
                      const sc = STATUS_CONFIG[r.status] ?? { color: "bt-badge-declined", dot: "bg-gray-400", label: r.status }
                      return (
                        <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{r.service_name || r.title || "Untitled Request"}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {r.builder_name && r.builder_name !== "No builder assigned yet"
                                ? `🔨 ${r.builder_name}`
                                : "🌐 Global Marketplace"}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{r.final_price ?? r.budget ?? "No budget"}</span>
                              {r.created_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString()}</span>}
                            </div>
                            <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, r.progress ?? 0))}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Mini progress */}
                            <div className="hidden sm:flex flex-col items-end gap-0.5">
                              <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{r.progress ?? 0}% done</span>
                            </div>

                            <Link
                              href={`/workspace/${r.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted/60 transition-all font-medium"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── COMPLETED PROJECTS ── */}
          {completedProjects.length > 0 && (
            <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-sm">
                  Completed Projects
                  <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">{completedProjects.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {completedProjects.map((r: any, i: number) => (
                  <div key={r.id ?? i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.service_name || r.title || "Untitled Project"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.builder_name && r.builder_name !== "No builder assigned yet" ? `🔨 ${r.builder_name}` : "🌐 Global Marketplace"}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{r.final_price ?? r.budget ?? "No budget"}</span>
                        {r.created_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border bt-badge-completed">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                      <Link
                        href={`/workspace/${r.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted/60 transition-all font-medium"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REJECTED PROJECTS ── */}
          {rejectedProjects.length > 0 && (
            <div className="mt-6 bg-card border border-red-200 dark:border-red-900/60 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-red-100 dark:border-red-900/50 flex items-center justify-between">
                <h2 className="font-semibold text-sm">
                  Rejected Projects
                  <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{rejectedProjects.length}</span>
                </h2>
                <span className="text-xs text-muted-foreground">Available for retry</span>
              </div>
              <div className="divide-y divide-border">
                {rejectedProjects.map((r: any, i: number) => (
                  <div key={r.id ?? i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.service_name || r.title || "Untitled Project"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.builder_name && r.builder_name !== "No builder assigned yet" ? `🔨 ${r.builder_name}` : "🌐 Global Marketplace"}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bt-badge-declined">{r.status}</span>
                    <Link
                      href="/student/requests/new"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                      Retry Request <Plus className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {notifications.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Notifications</h2>
              </div>
              <div className="divide-y divide-border">
                {notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <span className="text-sm">{n.message}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{n.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </RoleGuard>
  )
}
