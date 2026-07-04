"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowser } from "@/lib/supabase/client"

export default function WorkspacePage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Builder proposing session state
  const [topic, setTopic] = useState("")
  const [datetime, setDatetime] = useState("")
  const [link, setLink] = useState("")
  
  // Builder progress state
  const [newProgress, setNewProgress] = useState(0)
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  
  // Review state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const fetchWorkspace = async () => {
    try {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      // We will parse role from localstorage or token if possible, but for demo we can check current URL context or just show all UI blocks. 
      // In a real app we'd decode the JWT. Let's rely on a mock state for demo.
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') || 'parent' : 'parent'
      setUserRole(storedRole)
      
      const res = await fetch(`http://localhost:8000/workspaces/${id}`)
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
    const res = await fetch(`http://localhost:8000/workspaces/${id}/sessions`, {
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
      alert("Session proposed!")
      fetchWorkspace()
    }
  }

  const handleApproveSession = async (sessionId: number) => {
    const res = await fetch(`http://localhost:8000/workspaces/${id}/sessions/${sessionId}/approve`, {
      method: "PUT"
    })
    if (res.ok) {
      alert("Session scheduled!")
      fetchWorkspace()
    }
  }

  const handleUpdateProgress = async () => {
    const pVal = parseInt(newProgress.toString(), 10)
    
    // Update progress
    const res = await fetch(`http://localhost:8000/workspaces/${id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: pVal })
    })
    
    if (res.ok) {
      toast({ title: "Progress updated!" })
      
      // Automatically release Escrow if 100%
      if (pVal === 100 && data?.escrow?.status === "held") {
        try {
          const escRes = await fetch(`http://localhost:8000/escrow/${id}/release`, {
            method: "POST"
          })
          if (escRes.ok) {
            toast({ title: "Project Complete", description: "Escrow funds have been successfully released!" })
          } else {
            toast({ title: "Escrow Error", description: "Failed to release funds.", variant: "destructive" })
          }
        } catch (e) {
          console.error(e)
        }
      }
      
      fetchWorkspace()
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
      const res = await fetch(`http://localhost:8000/workspaces/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_url: mockUrl,
          uploader_role: userRole
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
      const res = await fetch(`http://localhost:8000/reviews`, {
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

  if (loading) {
    return (
      <AppShell role="parent">
        <div className="p-8">Loading workspace...</div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell role="parent">
        <div className="p-8">Workspace not found.</div>
      </AppShell>
    )
  }

  // To let reviewers test both modes easily on local, we provide role switch buttons purely for the demo:
  const switchRole = (role: string) => {
    localStorage.setItem('demo_role', role)
    setUserRole(role)
  }

  return (
    <AppShell role={userRole === "builder" ? "builder" : userRole === "student" ? "student" : "parent"}>
      <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
        
        <div className="mb-6 flex gap-2 justify-end">
           <Badge variant="outline" className="cursor-pointer" onClick={() => switchRole('parent')}>View as Parent</Badge>
           <Badge variant="outline" className="cursor-pointer" onClick={() => switchRole('builder')}>View as Builder</Badge>
           <Badge variant="outline" className="cursor-pointer" onClick={() => switchRole('student')}>View as Student</Badge>
        </div>

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
                <Badge variant={data.escrow.status === 'held' ? 'secondary' : 'default'}>
                  {data.escrow.status === 'held' ? 'FUNDS HELD' : 'RELEASED'}
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
                
                {userRole === "builder" && (
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

            {userRole === "builder" && (
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
                      <Label>Date & Time</Label>
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

                    {(userRole === "parent" || userRole === "student") && s.status === "proposed" && (
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
                        {f.file_url.includes('image') || f.file_url.includes('.png') || f.file_url.includes('.jpg') ? (
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
        
        {/* Review Section for Parents when completed */}
        {userRole === "parent" && data.progress === 100 && (
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
