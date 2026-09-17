"use client"

import { AppShell } from "@/components/app-shell"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import {
    AlertTriangle,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    FileText,
    Loader2,
    Star,
    Upload,
    Video
} from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

/* ── CIRCULAR PROGRESS RING ── */
function CircularProgress({ value }: { value: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/50" />
        {/* Fill */}
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke="url(#pg)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black">{value}%</span>
        <span className="text-[10px] text-muted-foreground font-medium">Complete</span>
      </div>
    </div>
  )
}

/* ── INTERACTIVE STAR RATING ── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hovered || value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
    </div>
  )
}

/* ── STATUS CONFIG ── */
const STATUS_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  "Pending Parent Approval": { label: "Pending Approval", badge: "bt-badge-approval", color: "text-amber-600" },
  "Pending Builder Acceptance": { label: "With Builder", badge: "bt-badge-pending", color: "text-blue-600" },
  "Pending Final Parent Approval": { label: "Quote Ready", badge: "bt-badge-quote", color: "text-purple-600" },
  "In Progress": { label: "In Progress", badge: "bt-badge-progress", color: "text-emerald-600" },
  "Pending Parent Completion Review": { label: "Ready for Review", badge: "bt-badge-review", color: "text-teal-600" },
  "Completed": { label: "Completed", badge: "bt-badge-completed", color: "text-green-600" },
  "Declined": { label: "Declined", badge: "bt-badge-declined", color: "text-gray-500" },
}

export default function WorkspacePage() {
  const { id } = useParams()
  const { toast } = useToast()
  const { role } = useAuth()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Builder: session proposal state
  const [topic, setTopic] = useState("")
  const [datetime, setDatetime] = useState("")
  const [link, setLink] = useState("")

  // Builder: progress state
  const [newProgress, setNewProgress] = useState(0)
  const [updatingProgress, setUpdatingProgress] = useState(false)

  // File upload state
  const [isUploading, setIsUploading] = useState(false)

  // Review state (parent, project complete)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isVerifyingCompletion, setIsVerifyingCompletion] = useState(false)

  // Escrow state
  const [isRefunding, setIsRefunding] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

  const fetchWorkspace = async () => {
    try {
      const res = await apiFetch(`/workspaces/${id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setNewProgress(json.progress)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkspace() }, [id])

  const handleProposeSession = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await apiFetch(`/workspaces/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, scheduled_at: new Date(datetime).toISOString(), duration_minutes: 60, meeting_link: link })
    })
    if (res.ok) { toast({ title: "Session proposed!" }); fetchWorkspace() }
    else toast({ title: "Failed to propose session", variant: "destructive" })
  }

  const handleApproveSession = async (sessionId: number) => {
    const res = await apiFetch(`/workspaces/${id}/sessions/${sessionId}/approve`, { method: "PUT" })
    if (res.ok) { toast({ title: "Session scheduled!" }); fetchWorkspace() }
    else toast({ title: "Failed to approve session", variant: "destructive" })
  }

  const handleUpdateProgress = async () => {
    setUpdatingProgress(true)
    const res = await apiFetch(`/workspaces/${id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: parseInt(newProgress.toString(), 10) })
    })
    if (res.ok) { toast({ title: "Progress updated!" }); fetchWorkspace() }
    else toast({ title: "Failed to update progress", variant: "destructive" })
    setUpdatingProgress(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setIsUploading(true)
    try {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime: file.type || "application/octet-stream" }),
      }).then(r => r.json())
      const fd = new FormData()
      fd.append("file", file)
      const uploadRes = await fetch(presign.uploadUrl, { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      const mockUrl = uploadData?.media?.url || uploadData?.media?.thumbnailUrl || "https://example.com/mock-file.png"
      const res = await apiFetch(`/workspaces/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: file.name, file_url: mockUrl, uploader_role: role })
      })
      if (res.ok) { toast({ title: "File attached!" }); fetchWorkspace() }
      else toast({ title: "Failed to attach file", variant: "destructive" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true)
    try {
      const res = await apiFetch(`/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: parseInt(id as string, 10), rating, comment: comment.trim() })
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok) {
        toast({ title: "Review submitted!" })
        setReviewSubmitted(true)
      } else if (result.detail === "Review already exists for this project") {
        setReviewSubmitted(true)
      } else {
        toast({ title: "Failed to submit review", variant: "destructive", description: result.detail || "Please try again." })
      }
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleVerifyCompletion = async () => {
    if (!confirm("Confirm that the project is complete? This will mark it completed and allow you to leave a review.")) return
    setIsVerifyingCompletion(true)
    try {
      const res = await apiFetch(`/workspaces/${id}/verify-completion`, { method: "POST" })
      const result = await res.json().catch(() => ({}))
      if (res.ok) {
        toast({ title: "Project completed!", description: "You can now leave a review for the builder." })
        fetchWorkspace()
      } else {
        toast({ title: "Could not verify completion", description: result.detail || "Please try again.", variant: "destructive" })
      }
    } finally {
      setIsVerifyingCompletion(false)
    }
  }

  const handleReleaseEscrow = async () => {
    if (!confirm("Are you sure you want to approve this project and release escrow funds? This cannot be undone.")) return
    setIsReleasing(true)
    const res = await apiFetch(`/escrow/${id}/release`, { method: "POST" })
    if (res.ok) { toast({ title: "Funds Released!" }); fetchWorkspace() }
    else { const err = await res.json(); toast({ title: "Release Failed", description: err.detail, variant: "destructive" }) }
    setIsReleasing(false)
  }

  const handleRefund = async () => {
    if (!confirm("Are you sure you want to cancel and request a refund? This cannot be undone.")) return
    setIsRefunding(true)
    const res = await apiFetch(`/escrow/${id}/refund`, { method: "POST" })
    const result = await res.json()
    if (res.status === 200 && result.status === "refunded") {
      toast({ title: "Refund Successful", description: `$${result.amount} refunded.` })
      fetchWorkspace()
    } else if (res.status === 202 && result.status === "refund_requested") {
      toast({ title: "Refund Request Submitted", description: result.message })
      fetchWorkspace()
    } else {
      toast({ title: "Refund Failed", description: result.detail, variant: "destructive" })
    }
    setIsRefunding(false)
  }

  if (loading) {
    return (
      <AppShell role={role ?? "parent"}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading workspace…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell role={role ?? "parent"}>
        <div className="py-20 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">Workspace not found</p>
          <p className="text-sm text-muted-foreground mt-1">This workspace may have been deleted or doesn't exist.</p>
        </div>
      </AppShell>
    )
  }

  const sc = STATUS_CONFIG[data.status] ?? STATUS_CONFIG["Declined"]
  const shellRole = role === "builder" ? "builder" : role === "student" ? "student" : "parent"
  const escrow = data.escrow

  return (
    <AppShell role={shellRole} showAuthActions>
      <div className="space-y-6">
        {/* ── WORKSPACE HEADER ── */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold">{data.service?.type || "Project"} Workspace</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.badge}`}>
                  {sc.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Student: <span className="font-medium text-foreground">{data.student?.name}</span>
                {" · "}
                Builder: <span className="font-medium text-foreground">{data.builder?.name}</span>
              </p>
            </div>

            {/* Escrow badge */}
            {escrow && escrow.status !== "none" && (
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Payment Escrow</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-lg font-bold">${escrow.amount}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    escrow.status === "held" ? "bg-blue-100 text-blue-700"
                    : escrow.status === "released" ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {escrow.status === "held" ? "HELD"
                    : escrow.status === "released" ? "RELEASED"
                    : escrow.status === "refunded" ? "REFUNDED"
                    : "PENDING"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Progress card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-4">Project Progress</h2>
              <div className="flex items-center gap-6">
                <CircularProgress value={data.progress ?? 0} />
                <div className="flex-1 space-y-3">
                  {/* Linear bar too */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Overall completion</span>
                      <span className="font-semibold text-foreground">{data.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bt-progress-bar rounded-full transition-all duration-700"
                        style={{ width: `${data.progress}%` }}
                      />
                    </div>
                  </div>
                  {data.budget && (
                    <div className="text-xs text-muted-foreground">
                      Budget: <span className="font-semibold text-foreground">${data.budget}</span>
                      {data.final_price && <> · Final: <span className="font-semibold text-foreground">${data.final_price}</span></>}
                    </div>
                  )}
                </div>
              </div>

              {/* Builder progress updater */}
              {role === "builder" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Update Progress</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="0" max="100"
                      value={newProgress}
                      onChange={e => setNewProgress(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-bold w-10 text-right">{newProgress}%</span>
                    <button
                      onClick={handleUpdateProgress}
                      disabled={updatingProgress}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
                    >
                      {updatingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Propose session (builder only) */}
            {role === "builder" && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-semibold text-sm mb-1">Propose a Session</h2>
                <p className="text-xs text-muted-foreground mb-4">Schedule a video call with the student.</p>
                <form onSubmit={handleProposeSession} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Topic / Goal</label>
                    <input
                      value={topic} onChange={e => setTopic(e.target.value)} required
                      placeholder="e.g. Code Review"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Date &amp; Time</label>
                    <input
                      type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Meeting Link</label>
                    <input
                      type="url" value={link} onChange={e => setLink(e.target.value)} required
                      placeholder="https://meet.google.com/..."
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    Propose Session
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">
            {/* Learning Sessions */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Learning Sessions</h2>
              </div>
              <div className="divide-y divide-border">
                {data.sessions?.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground text-center">No sessions scheduled yet.</p>
                ) : (
                  data.sessions?.map((s: any) => (
                    <div key={s.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-sm">{s.topic}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes}min
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          s.status === "scheduled" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>

                      {s.meeting_link && s.status === "scheduled" && (
                        <a
                          href={s.meeting_link} target="_blank" rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Join Meeting
                        </a>
                      )}

                      {(role === "parent" || role === "student") && s.status === "proposed" && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Builder proposed this session. Approve to schedule?</p>
                          <button
                            onClick={() => handleApproveSession(s.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Session
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILE UPLOADS (full width) ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <h2 className="font-semibold text-sm">Project Artifacts</h2>
                <p className="text-xs text-muted-foreground">Photos, blueprints, and files</p>
              </div>
            </div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className={`flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all ${isUploading ? "opacity-60 cursor-wait" : ""}`}>
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isUploading ? "Uploading…" : "Upload File"}
              </span>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="p-4">
            {data.files?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {data.files.map((f: any) => (
                  <div key={f.id} className="group relative aspect-square bg-muted rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer">
                    {(f.file_url?.includes("image") || f.file_url?.includes(".png") || f.file_url?.includes(".jpg") || f.file_url?.includes(".jpeg") || f.file_url?.includes(".webp")) ? (
                      <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
                    ) : f.file_url?.includes("video") ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Video className="w-8 h-8 text-slate-300" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-1.5">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-medium truncate block">{f.file_name}</span>
                        <span className="text-[9px] text-white/70 uppercase">{f.uploader_role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PARENT ACTION BANNERS ── */}

        {/* Refund under review */}
        {role === "parent" && data.progress < 100 && data.escrow?.status === "refund_requested" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Refund Under Admin Review</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Your refund request has been submitted. An admin will review the dispute and contact you within 1–2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Request refund */}
        {role === "parent" && data.escrow?.status === "held" && data.progress < 100 && (
          <div className="bg-card border border-destructive/40 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Cancel &amp; Request Refund</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If you're unsatisfied with the progress, you can cancel this project and request a refund. This action cannot be undone.
                </p>
                <button
                  onClick={handleRefund}
                  disabled={isRefunding}
                  className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-semibold rounded-xl hover:bg-destructive/90 transition-all disabled:opacity-60"
                >
                  {isRefunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {isRefunding ? "Processing…" : `Refund $${data.escrow.amount} to Me`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Release escrow */}
        {role === "parent" && data.progress === 100 && data.escrow?.status === "held" && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">🎉 Project Complete — Release Funds</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  The builder has marked this project 100% complete. Review the work and release the escrowed funds to the builder.
                </p>
                <button
                  onClick={handleReleaseEscrow}
                  disabled={isReleasing}
                  className="mt-3 flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-60"
                >
                  {isReleasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isReleasing ? "Releasing Funds…" : "Approve & Release Funds"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave a review */}
        {role === "parent" && data.status === "Pending Parent Completion Review" && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-semibold text-emerald-800 dark:text-emerald-300">Project ready for your review</h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Confirm the work is complete before releasing payment and rating the builder.</p>
                <button
                  onClick={handleVerifyCompletion}
                  disabled={isVerifyingCompletion}
                  className="mt-3 flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-60"
                >
                  {isVerifyingCompletion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isVerifyingCompletion ? "Verifying…" : "Verify Completion"}
                </button>
              </div>
            </div>
          </div>
        )}

        {role === "parent" && data.status === "Completed" && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-1">Leave a Review</h2>
            <p className="text-xs text-muted-foreground mb-4">How was your experience with {data.builder?.name}?</p>

            {reviewSubmitted ? (
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Thank you for your feedback!
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Rating</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience with this builder…"
                    rows={3}
                    className="rounded-xl border-border focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  {isSubmittingReview ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
