"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Plus, Trash2,
  ExternalLink, TrendingUp, Users, ChevronDown, ChevronUp, Check
} from "lucide-react"

/* ── STATUS HELPERS ── */
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; borderClass: string; dotClass: string; icon: React.ElementType }> = {
  "Pending Parent Approval": { label: "Pending Approval", badgeClass: "bt-badge-approval", borderClass: "border-l-amber-400", dotClass: "bg-amber-400", icon: Clock },
  "Pending Builder Acceptance": { label: "With Builder", badgeClass: "bt-badge-pending", borderClass: "border-l-blue-400", dotClass: "bg-blue-400", icon: Clock },
  "Pending Final Parent Approval": { label: "Quote Ready", badgeClass: "bt-badge-quote", borderClass: "border-l-purple-400", dotClass: "bg-purple-400", icon: AlertCircle },
  "In Progress": { label: "In Progress", badgeClass: "bt-badge-progress", borderClass: "border-l-emerald-400", dotClass: "bg-emerald-400", icon: TrendingUp },
  "Pending Parent Completion Review": { label: "Ready to Review", badgeClass: "bt-badge-review", borderClass: "border-l-teal-400", dotClass: "bg-teal-400", icon: CheckCircle2 },
  "Completed": { label: "Completed", badgeClass: "bt-badge-completed", borderClass: "border-l-green-500", dotClass: "bg-green-500", icon: Check },
  "Declined": { label: "Declined", badgeClass: "bt-badge-declined", borderClass: "border-l-gray-300", dotClass: "bg-gray-400", icon: XCircle },
}

function statusToTimelineStage(status: string) {
  if (status === "Pending Parent Approval") return 0
  if (status === "Pending Builder Acceptance" || status === "Pending Final Parent Approval") return 1
  if (status === "In Progress") return 2
  if (status === "Pending Parent Completion Review" || status === "Completed") return 3
  return 0
}

function isRejectedStatus(status: unknown) {
  return ["declined", "rejected", "rejected by builder"].includes(
    String(status ?? "").trim().toLowerCase()
  )
}

/* ── TIMELINE ── */
function TimelineStepper({ stage, completed }: { stage: number; completed: boolean }) {
  const steps = ["Submitted", "Approved", "In Build", "Delivered"]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < stage || (i === stage && completed)
        const current = i === stage && !completed
        return (
          <div key={s} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div className={[
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                done ? "bg-primary border-primary" : current ? "bg-background border-primary" : "bg-background border-border"
              ].join(" ")}>
                {done
                  ? <Check className="w-3 h-3 text-white" />
                  : current
                    ? <div className="w-2 h-2 rounded-full bg-primary" />
                    : null
                }
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap font-medium">{s}</span>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-8 mb-4 transition-all ${i < stage ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── PROJECT CARD ── */
function ProjectCard({ project, onApprove, onConfirm, onVerify, onDelete }: any) {
  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG["Declined"]
  const stage = statusToTimelineStage(project.status)
  const completed = project.status === "Completed"
  const Icon = sc.icon
  const progress = project.progress ?? 0

  return (
    <div className={`bg-card border border-border border-l-4 ${sc.borderClass} rounded-2xl overflow-hidden bt-card-hover flex flex-col`}>
      {/* Card header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{project.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">for {project.child_name}</p>
          </div>
          {/* Status badge */}
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border ${sc.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass} flex-shrink-0`} />
            {sc.label}
          </span>
        </div>

        {/* Builder / budget info */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{project.builder_name !== "No builder assigned yet" ? `🔨 ${project.builder_name}` : "🌐 Global Marketplace"}</span>
          {project.final_price ? (
            <span className="font-semibold text-foreground">· ${project.final_price}</span>
          ) : project.budget ? (
            <span>· Budget ${project.budget}</span>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bt-progress-bar rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 pb-4">
        <TimelineStepper stage={stage} completed={completed} />
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 mt-auto flex flex-wrap gap-2">
        {project.status === "Pending Parent Approval" && (
          <button
            onClick={() => onApprove(project.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve &amp; Send to Builder
          </button>
        )}
        {project.status === "Pending Final Parent Approval" && (
          <button
            onClick={() => onConfirm(project.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm &amp; Pay Quote (${project.final_price})
          </button>
        )}
        {project.status === "Pending Parent Completion Review" && (
          <Link
            href={`/workspace/${project.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review &amp; Release Payout
          </Link>
        )}

        <Link
          href={`/workspace/${project.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-muted/60 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Workspace
        </Link>

        {project.can_delete && (
          <button
            onClick={() => onDelete(project.id, project.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-all dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

/* ── MAIN PAGE ── */
export default function ParentDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [childEmail, setChildEmail] = useState("")
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/auth/login"); return }
    if (role !== "parent") {
      router.replace(role === "builder" ? "/builder/dashboard" : "/student/dashboard")
      return
    }
  }, [authLoading, user, role, router])

  async function fetchDashboard() {
    if (!user?.email) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)

    try {
      setLoadError(null)
      const response = await apiFetch(`/dashboards/parent?email=${encodeURIComponent(user.email)}`, {
        signal: controller.signal,
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.detail || `Dashboard request failed (${response.status})`)
      }
      setData(body)
    } catch (error: any) {
      setLoadError(error.name === "AbortError" ? "The dashboard request timed out. Check that the backend is running." : error.message)
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user?.email) fetchDashboard()
  }, [authLoading, user])

  async function handleApprove(id: number) {
    const res = await apiFetch(`/workspaces/${id}/approve`, { method: "POST" })
    if (res.ok) { toast({ title: "Approved!", description: "Request sent to builder." }); fetchDashboard() }
    else { const err = await res.json(); toast({ title: "Error", description: err.detail, variant: "destructive" }) }
  }

  async function handleConfirm(id: number) {
    const res = await apiFetch(`/workspaces/${id}/parent-confirm`, { method: "POST" })
    if (res.ok) { toast({ title: "Confirmed!", description: "Project is now In Progress." }); fetchDashboard() }
    else { const err = await res.json(); toast({ title: "Error", description: err.detail, variant: "destructive" }) }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete request "${title}"? This cannot be undone.`)) return
    const res = await apiFetch(`/workspaces/${id}/cancel`, { method: "POST" })
    if (res.ok) { toast({ title: "Deleted", description: "Request removed." }); fetchDashboard() }
    else { const err = await res.json(); toast({ title: "Error", description: err.detail, variant: "destructive" }) }
  }

  async function handleLinkChild(e: React.FormEvent) {
    e.preventDefault()
    setLinking(true)
    const res = await apiFetch("/parents/children/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_email: user!.email, child_email: childEmail }),
    })
    const json = await res.json()
    if (res.ok) {
      toast({ title: "Child linked!", description: json.message })
      setShowAddChild(false); setChildEmail(""); fetchDashboard()
    } else {
      toast({ title: "Error", description: json.detail, variant: "destructive" })
    }
    setLinking(false)
  }

  if (authLoading || loading) {
    return (
      <AppShell role="parent" showAuthActions>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (loadError) {
    return (
      <AppShell role="parent" showAuthActions>
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md text-center space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="text-lg font-semibold">Could not load your dashboard</h1>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button onClick={() => { setLoading(true); fetchDashboard() }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Try again
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const projects = data?.projects ?? []
  const rejectedProjects = projects.filter((p: any) => isRejectedStatus(p.status))
  const visibleProjects = projects.filter((p: any) => !isRejectedStatus(p.status))
  const children = data?.children ?? []

  // Stats
  const totalProjects = projects.length
  const pendingCount = projects.filter((p: any) => p.status.includes("Pending")).length
  const completedCount = projects.filter((p: any) => p.status === "Completed").length

  return (
    <AppShell role="parent" showAuthActions>
      <div className="space-y-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor your children's projects and approve builder requests.
            </p>
          </div>
          <button
            onClick={() => setShowAddChild(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm flex-shrink-0"
          >
            {showAddChild ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddChild ? "Cancel" : "Add Child"}
          </button>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Projects", value: totalProjects, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: TrendingUp },
            { label: "Pending Actions", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
            { label: "Completed", value: completedCount, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 bt-stat-card">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* ── ADD CHILD FORM ── */}
        {showAddChild && (
          <div className="bg-card border border-border rounded-2xl p-5 bt-slide-up">
            <h2 className="font-semibold text-sm mb-3">Link a Child Account</h2>
            <form onSubmit={handleLinkChild} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="child-email" className="text-xs font-medium text-muted-foreground">Child's Email Address</label>
                <input
                  id="child-email"
                  type="email"
                  placeholder="child@example.com"
                  value={childEmail}
                  onChange={e => setChildEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={linking}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 shadow-sm whitespace-nowrap"
              >
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {linking ? "Linking…" : "Link Child"}
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">The child must already have a student account before linking.</p>
          </div>
        )}

        {/* ── PROJECTS GRID ── */}
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
            Projects ({visibleProjects.length})
          </h2>
          {visibleProjects.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium text-sm">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {children.length === 0
                  ? "Add a child first to see their requests here."
                  : "Once your child submits a request, it will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleProjects.map((p: any) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onApprove={handleApprove}
                  onConfirm={handleConfirm}
                  onVerify={() => router.push(`/workspace/${p.id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {rejectedProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Rejected Requests ({rejectedProjects.length})
              </h2>
              <span className="text-xs text-muted-foreground">Kept for history and retry</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedProjects.map((p: any) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onApprove={handleApprove}
                  onConfirm={handleConfirm}
                  onVerify={() => router.push(`/workspace/${p.id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
