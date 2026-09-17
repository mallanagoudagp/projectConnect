"use client"

import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import {
    AlertCircle,
    Check,
    ChevronDown, ChevronUp,
    DollarSign,
    ExternalLink,
    Globe,
    Loader2,
    Package,
    Plus,
    Star,
    Trash2,
    TrendingUp,
    Upload,
    X
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  )
}

export default function BuilderDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Quote form state
  const [quotingProjectId, setQuotingProjectId] = useState<number | null>(null)
  const [quotePrice, setQuotePrice] = useState("")
  const [submittingQuote, setSubmittingQuote] = useState(false)

  // Services state
  const [showServices, setShowServices] = useState(false)
  const [newServiceName, setNewServiceName] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [newServiceCategory, setNewServiceCategory] = useState("")
  const [addingService, setAddingService] = useState(false)

  // Global marketplace claim state
  const [claimingId, setClaimingId] = useState<number | null>(null)
  const [claimPrice, setClaimPrice] = useState("")

  const email = user?.email || "builder@demo.com"

  function fetchDashboard() {
    apiFetch(`/dashboards/builder?email=${encodeURIComponent(email)}`)
      .then(async res => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.detail || `Dashboard request failed (${res.status})`)
        return body
      })
      .then(d => {
        setData(d)
        if (d.builder?.id) {
          apiFetch(`/builders/${d.builder.id}/analytics`)
            .then(r => r.json())
            .then(a => setAnalytics(a))
            .catch(console.error)
        }
        setLoading(false)
      })
        .catch(err => { console.error("Failed to load builder dashboard:", err); setLoading(false) })
  }

  useEffect(() => { fetchDashboard() }, [])

  async function handleAcceptWithQuote(projectId: number) {
    setSubmittingQuote(true)
    const res = await apiFetch(`/workspaces/${projectId}/builder-accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ final_price: parseFloat(quotePrice) })
    })
    if (res.ok) {
      setQuotingProjectId(null)
      setQuotePrice("")
      fetchDashboard()
    }
    setSubmittingQuote(false)
  }

  async function handleReject(projectId: number) {
    await apiFetch(`/workspaces/${projectId}/reject`, { method: "POST" })
    fetchDashboard()
  }

  async function handleClaim(projectId: number) {
    setClaimingId(projectId)
    const res = await apiFetch(`/workspaces/${projectId}/builder-accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ final_price: parseFloat(claimPrice) })
    })
    if (res.ok) {
      setClaimingId(null)
      setClaimPrice("")
      fetchDashboard()
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    setAddingService(true)
    await apiFetch(`/builders/services?email=${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newServiceName, price: parseFloat(newServicePrice), category: newServiceCategory })
    })
    setNewServiceName(""); setNewServicePrice(""); setNewServiceCategory("")
    fetchDashboard()
    setAddingService(false)
  }

  async function handleDeleteService(id: number) {
    await apiFetch(`/builders/services/${id}`, { method: "DELETE" })
    fetchDashboard()
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["builder"]}>
        <AppShell role="builder" showAuthActions>
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

  const projects = data?.projects || []
  const builder = data?.builder || {}
  const pendingRequests = data?.pending_requests || []
  const globalRequests = data?.global_requests || []
  const services = data?.services || []

  return (
    <RoleGuard allowedRoles={["builder"]}>
      <AppShell role="builder" showAuthActions>
        <div className="space-y-6">
          {/* ── BUILDER HERO ── */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {builder.name?.charAt(0) || "B"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{builder.name || "Builder"}</h1>
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <StarDisplay rating={builder.rating ?? 0} />
                <span className="text-sm text-muted-foreground">{builder.rating ?? "—"} / 5.0</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{projects.length} active student{projects.length !== 1 ? "s" : ""}</span>
              </div>
              {builder.blurb && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{builder.blurb}</p>}
            </div>
            <Link
              href="/builder/uploads"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm flex-shrink-0"
            >
              <Upload className="w-4 h-4" /> Go to Uploads
            </Link>
          </div>

          {/* ── ANALYTICS STATS ── */}
          {analytics && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Earnings", value: `$${analytics.total_earnings?.toFixed(2) || "0.00"}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                { label: "Avg Rating", value: `${analytics.average_rating || "—"} ⭐`, icon: Star, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                { label: "Projects Done", value: analytics.projects_completed || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4 bt-stat-card">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── PENDING REQUESTS TO REVIEW ── */}
          {pendingRequests.length > 0 && (
            <div className="bg-card border-2 border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                  New Requests to Review ({pendingRequests.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{req.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Student: {req.child_name} · Budget: ${req.budget}</p>
                      </div>
                    </div>

                    {quotingProjectId === req.id ? (
                      <div className="bg-muted/40 rounded-xl p-3 space-y-3">
                        <label className="text-xs font-medium">Set Your Final Price ($)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={quotePrice}
                            onChange={e => setQuotePrice(e.target.value)}
                            placeholder={req.budget || "Enter price"}
                            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                          <button
                            onClick={() => handleAcceptWithQuote(req.id)}
                            disabled={submittingQuote || !quotePrice}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
                          >
                            {submittingQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Submit Quote
                          </button>
                          <button
                            onClick={() => setQuotingProjectId(null)}
                            className="px-3 py-2 border border-border rounded-xl text-xs hover:bg-muted/60 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setQuotingProjectId(req.id); setQuotePrice(req.budget || "") }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Review &amp; Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-xs font-medium rounded-xl hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GLOBAL MARKETPLACE ── */}
          {globalRequests.length > 0 && (
            <div className="bg-card border-2 border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-sm text-blue-800 dark:text-blue-300">
                  🌐 Global Marketplace Requests ({globalRequests.length})
                </h2>
                <span className="text-[11px] text-blue-500 ml-auto">Open to all verified builders</span>
              </div>
              <div className="divide-y divide-border">
                {globalRequests.map((req: any) => (
                  <div key={req.id} className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{req.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Budget: ${req.budget}</p>
                      </div>
                    </div>

                    {claimingId === req.id ? (
                      <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                        <label className="text-xs font-medium">Your Price ($)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={claimPrice}
                            onChange={e => setClaimPrice(e.target.value)}
                            placeholder={req.budget}
                            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                          <button
                            onClick={() => handleClaim(req.id)}
                            disabled={!claimPrice}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
                          >
                            Claim
                          </button>
                          <button onClick={() => setClaimingId(null)} className="px-3 py-2 border border-border rounded-xl text-xs hover:bg-muted/60 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setClaimingId(req.id); setClaimPrice(req.budget || "") }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                      >
                        <Globe className="w-3.5 h-3.5" /> Claim &amp; Quote
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ASSIGNED PROJECTS ── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Assigned Projects</h2>
              <span className="ml-auto text-xs text-muted-foreground">{projects.length} total</span>
            </div>
            <div className="divide-y divide-border">
              {projects.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="text-3xl mb-2">🔨</div>
                  <p className="text-sm font-medium">No assigned projects yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Accept requests to start building.</p>
                </div>
              ) : (
                projects.map((p: any) => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.title || p.service_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Student: {p.child_name}</div>
                      {/* Mini progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bt-progress-bar rounded-full"
                            style={{ width: `${p.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.progress ?? 0}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">{p.status}</span>
                      <Link
                        href={`/workspace/${p.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted/60 transition-all font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> Workspace
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── RECENT REVIEWS ── */}
          {analytics?.recent_reviews?.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Recent Reviews</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {analytics.recent_reviews.map((r: any) => (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm">{r.parent_name}</div>
                      <StarDisplay rating={r.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MANAGE SERVICES ── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowServices(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Manage My Services ({services.length})
              </div>
              {showServices ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showServices && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Existing services */}
                {services.length > 0 && (
                  <div className="space-y-2">
                    {services.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-xl">
                        <div>
                          <span className="text-sm font-medium">{s.title}</span>
                          <span className="text-xs text-muted-foreground ml-2">· {s.category} · ${s.price}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add service form */}
                <form onSubmit={handleAddService} className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add New Service</h3>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      required
                      placeholder="Service name"
                      value={newServiceName}
                      onChange={e => setNewServiceName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price ($)"
                      value={newServicePrice}
                      onChange={e => setNewServicePrice(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <input
                      required
                      placeholder="Category"
                      value={newServiceCategory}
                      onChange={e => setNewServiceCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingService}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
                  >
                    {addingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Service
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  )
}
