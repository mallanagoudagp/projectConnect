"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function WorkspacePage() {
  const { id } = useParams()
  const { toast } = useToast()
  const { role } = useAuth()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Builder: proposing session state
  const [topic, setTopic] = useState("")
  const [datetime, setDatetime] = useState("")
  const [link, setLink] = useState("")

  // Builder: progress state
  const [newProgress, setNewProgress] = useState(0)

  // File upload state
  const [isUploading, setIsUploading] = useState(false)

  // Review state (parent, project complete)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  // Refund state (parent, project in-progress)
  const [isRefunding, setIsRefunding] = useState(false)

  // Release state (parent, project complete)
  const [isReleasing, setIsReleasing] = useState(false)

  const handleReleaseEscrow = async () => {
    if (!confirm("Are you sure you want to approve this project and release the escrow funds to the builder? This cannot be undone.")) return
    setIsReleasing(true)
    try {
      const res = await apiFetch(`/escrow/${id}/release`, {
        method: "POST"
      })
      if (res.ok) {
        toast({ title: "Funds Released", description: "Escrow funds have been successfully transferred to the builder!" })
        fetchWorkspace()
      } else {
        const err = await res.json()
        toast({ title: "Release Failed", description: err.detail || "Error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setIsReleasing(false)
    }
  }

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

  useEffect(() => {
    fetchWorkspace()
  }, [id])

  const handleProposeSession = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await apiFetch(`/workspaces/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        scheduled_at: new Date(datetime).toISOString(),
        duration_minutes: 60,
        meeting_link: link
      })
    })
    if (res.ok) {
      toast({ title: "Session proposed!" })
      fetchWorkspace()
    } else {
      toast({ title: "Failed to propose session", variant: "destructive" })
    }
  }

  const handleApproveSession = async (sessionId: number) => {
    const res = await apiFetch(`/workspaces/${id}/sessions/${sessionId}/approve`, {
      method: "PUT"
    })
    if (res.ok) {
      toast({ title: "Session scheduled!" })
      fetchWorkspace()
    } else {
      toast({ title: "Failed to approve session", variant: "destructive" })
    }
  }

  const handleUpdateProgress = async () => {
    const pVal = parseInt(newProgress.toString(), 10)

    const res = await apiFetch(`/workspaces/${id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: pVal })
    })

    if (res.ok) {
      toast({ title: "Progress updated!" })
      fetchWorkspace()
    } else {
      toast({ title: "Failed to update progress", variant: "destructive" })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setIsUploading(true)

    try {
      // 1. Get presigned mock URL
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime: file.type || "application/octet-stream" }),
      }).then((r) => r.json())

      // 2. Upload to mock storage
      const fd = new FormData()
      fd.append("file", file)
      const uploadRes = await fetch(presign.uploadUrl, { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      const mockUrl = uploadData?.media?.url || uploadData?.media?.thumbnailUrl || "https://example.com/mock-file.png"

      // 3. Save to FastAPI backend
      const res = await apiFetch(`/workspaces/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_url: mockUrl,
          uploader_role: role
        })
      })

      if (res.ok) {
        toast({ title: "File attached!" })
        fetchWorkspace()
      } else {
        toast({ title: "Failed to attach file", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitReview = async () => {
    try {
      const res = await apiFetch(`/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(id as string, 10),
          rating,
          comment
        })
      })
      if (res.ok) {
        toast({ title: "Review submitted!" })
        setReviewSubmitted(true)
      } else {
        const error = await res.json()
        if (error.detail === "Review already exists for this project") {
          setReviewSubmitted(true)
        } else {
          toast({ title: "Failed to submit review", variant: "destructive", description: error.detail })
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRefund = async () => {
    if (!confirm("Are you sure you want to cancel this project and request a refund? This cannot be undone.")) return
    setIsRefunding(true)
    try {
      const res = await apiFetch(`/escrow/${id}/refund`, {
        method: "POST"
      })
      const result = await res.json()

      if (res.status === 200 && result.status === "refunded") {
        // Path A: progress was 0, immediate refund
        toast({
          title: "Refund Successful",
          description: `$${result.amount} has been refunded. Refund ID: ${result.refund_id}`
        })
        fetchWorkspace()
      } else if (res.status === 202 && result.status === "refund_requested") {
        // Path B: work had started, queued for admin review
        toast({
          title: "Refund Request Submitted",
          description: result.message
        })
        fetchWorkspace()
      } else {
        toast({ title: "Refund Failed", description: result.detail || "Unexpected error", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setIsRefunding(false)
    }
  }

  if (loading) {
    return (
      <AppShell role={role ?? "parent"}>
        <div className="p-8">Loading workspace...</div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell role={role ?? "parent"}>
        <div className="p-8">Workspace not found.</div>
      </AppShell>
    )
  }

  return (
    <AppShell role={role === "builder" ? "builder" : role === "student" ? "student" : "parent"}>
      <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">{data.service.type} Workspace</h1>
            <p className="text-muted-foreground mt-2">
              Student: {data.student.name} | Builder: {data.builder.name}
            </p>
          </div>

          {data.escrow.status !== "none" && (
            <div className="mt-4 md:mt-0 bg-muted/50 px-4 py-2 rounded-md border flex flex-col items-end">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment Escrow</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">${data.escrow.amount}</span>
                <Badge variant={
                  data.escrow.status === "held" ? "secondary"
                  : data.escrow.status === "refunded" ? "destructive"
                  : data.escrow.status === "refund_requested" ? "destructive"
                  : "default"
                }>
                  {data.escrow.status === "held" ? "FUNDS HELD"
                  : data.escrow.status === "refunded" ? "REFUNDED"
                  : data.escrow.status === "refund_requested" ? "REFUND PENDING ADMIN"
                  : "RELEASED"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{data.progress}% Complete</span>
                  <Badge>{data.status}</Badge>
                </div>
                <Progress value={data.progress} className="mb-6" />

                {role === "builder" && (
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Update Progress</Label>
                    <div className="flex gap-2">
                      <Input type="number" min="0" max="100" value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} />
                      <Button onClick={handleUpdateProgress}>Update</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {role === "builder" && (
              <Card>
                <CardHeader>
                  <CardTitle>Propose a Session</CardTitle>
                  <CardDescription>Schedule a video call with the student.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProposeSession} className="grid gap-3">
                    <div>
                      <Label>Topic / Goal</Label>
                      <Input value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g. Code Review" />
                    </div>
                    <div>
                      <Label>Date &amp; Time</Label>
                      <Input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Meeting Link (Zoom/Meet)</Label>
                      <Input type="url" value={link} onChange={e => setLink(e.target.value)} required placeholder="https://..." />
                    </div>
                    <Button type="submit">Propose Session</Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Sessions</CardTitle>
                <CardDescription>Upcoming and completed meetings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.sessions.map((s: any) => (
                  <div key={s.id} className="border p-4 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{s.topic}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.scheduled_at).toLocaleString()} ({s.duration_minutes} min)
                        </p>
                      </div>
                      <Badge variant={s.status === "scheduled" ? "default" : "secondary"}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>

                    {s.meeting_link && s.status === "scheduled" && (
                      <div className="mt-4">
                        <Button variant="outline" asChild size="sm">
                          <a href={s.meeting_link} target="_blank" rel="noreferrer">Join Meeting</a>
                        </Button>
                      </div>
                    )}

                    {(role === "parent" || role === "student") && s.status === "proposed" && (
                      <div className="mt-4 border-t pt-3">
                        <p className="text-sm mb-2 text-muted-foreground">Builder proposed this session. Please approve.</p>
                        <Button onClick={() => handleApproveSession(s.id)} size="sm">Approve Session</Button>
                      </div>
                    )}
                  </div>
                ))}
                {data.sessions.length === 0 && <p className="text-muted-foreground text-sm">No sessions found.</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Artifacts</CardTitle>
                <CardDescription>Upload photos, blueprints, and files for this project.</CardDescription>
              </div>
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    {isUploading ? "Uploading..." : "Upload File"}
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </CardHeader>
            <CardContent>
              {data.files && data.files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.files.map((f: any) => (
                    <div key={f.id} className="border rounded-md p-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-muted/50 transition-colors">
                      <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {f.file_url.includes("image") || f.file_url.includes(".png") || f.file_url.includes(".jpg") ? (
                          <img src={f.file_url} alt={f.file_name} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-2xl">📄</span>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate w-full" title={f.file_name}>{f.file_name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{f.uploader_role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Refund / dispute section — parent only, escrow held or refund_requested, project not yet complete */}
        {role === "parent" && data.progress < 100 && data.escrow?.status === "refund_requested" && (
          <div className="mt-6">
            <Card className="border-yellow-500/40">
              <CardHeader>
                <CardTitle className="text-yellow-600">Refund Under Admin Review</CardTitle>
                <CardDescription>
                  Your refund request has been submitted. An admin will review the dispute and
                  contact you within 1–2 business days. No funds have moved yet.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {role === "parent" && data.escrow?.status === "held" && data.progress < 100 && (
          <div className="mt-6">
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Cancel &amp; Request Refund</CardTitle>
                <CardDescription>
                  If you are unsatisfied with the progress, you can cancel this project and have the
                  escrowed funds returned to you. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={isRefunding}
                >
                  {isRefunding ? "Processing Refund..." : `Refund $${data.escrow.amount} to Me`}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Release Escrow section — parent only, project 100% complete, funds still held */}
        {role === "parent" && data.progress === 100 && data.escrow?.status === "held" && (
          <div className="mt-6">
            <Card className="border-primary/45">
              <CardHeader>
                <CardTitle>Release Escrow Funds</CardTitle>
                <CardDescription>
                  The builder has completed the project (100% progress). Please review the work
                  and authorize the release of the escrowed funds. Once released, the funds will
                  be transferred to the builder's account. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleReleaseEscrow}
                  disabled={isReleasing}
                >
                  {isReleasing ? "Releasing Funds..." : "Approve &amp; Release Funds"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review section — parent only, project 100% complete */}
        {role === "parent" && data.progress === 100 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
                <CardDescription>How was your experience with this builder?</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewSubmitted ? (
                  <p className="text-sm text-green-600 font-medium">Thank you for your feedback!</p>
                ) : (
                  <div className="grid gap-4 max-w-xl">
                    <div className="grid gap-2">
                      <Label>Rating (1-5)</Label>
                      <Input type="number" min="1" max="5" value={rating} onChange={e => setRating(parseInt(e.target.value, 10) || 5)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Comment</Label>
                      <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." />
                    </div>
                    <Button onClick={handleSubmitReview}>Submit Review</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </AppShell>
  )
}
