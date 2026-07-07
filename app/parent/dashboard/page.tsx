"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Timeline } from "@/components/timeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, CheckCircle, Clock, Users } from "lucide-react"

export default function ParentDashboard() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Add student state
  const [childEmail, setChildEmail] = useState("")
  const [addingChild, setAddingChild] = useState(false)

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
    } else if (role && role !== "parent") {
      router.replace(role === "builder" ? "/builder/dashboard" : "/student/dashboard")
    }
  }, [authLoading, user, role, router])

  function fetchDashboard() {
    if (!user?.email) return
    apiFetch(`/dashboards/parent?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (authLoading || !user?.email) return
    fetchDashboard()
  }, [authLoading, user])

  async function handleAddChild() {
    if (!childEmail.trim()) return
    setAddingChild(true)
    try {
      const res = await apiFetch("/families/add-child", {
        method: "POST",
        body: JSON.stringify({ child_email: childEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail ?? "Failed to add student")
      toast({ title: "Student linked!", description: json.message })
      setChildEmail("")
      fetchDashboard()
    } catch (e: any) {
      toast({ title: "Could not add student", description: e.message, variant: "destructive" })
    } finally {
      setAddingChild(false)
    }
  }

  async function handleApprove(projectId: number) {
    try {
      const res = await apiFetch(`/workspaces/${projectId}/approve`, { method: "POST" })
      if (!res.ok) throw new Error("Approval failed")
      toast({ title: "Request approved!" })
      fetchDashboard()
    } catch (e: any) {
      toast({ title: "Could not approve", description: e.message, variant: "destructive" })
    }
  }

  if (authLoading || loading) {
    return (
      <AppShell role="parent">
        <div className="p-8 text-muted-foreground">Loading dashboard...</div>
      </AppShell>
    )
  }

  const projects = data?.projects ?? []
  const pendingApprovals = data?.pending_approvals ?? []
  const children = data?.children ?? []
  const notifications = data?.notifications ?? []

  return (
    <AppShell role="parent">
      <div className="grid gap-6">

        {/* Header */}
        <section className="grid gap-1">
          <h1 className="text-2xl font-semibold">👪 Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor student projects and manage your family.</p>
        </section>

        {/* Top row: Add Student + Children list */}
        <section className="grid gap-4 md:grid-cols-2">

          {/* Add Student Card */}
          <Card className="border-dashed border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Link a Student
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Enter your child's email address. They must have already signed up as a <strong>Student</strong>.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="child-email">Student email</Label>
                <Input
                  id="child-email"
                  type="email"
                  placeholder="student@example.com"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
                />
              </div>
              <Button onClick={handleAddChild} disabled={addingChild || !childEmail.trim()} className="w-fit">
                {addingChild ? "Linking..." : "Add Student"}
              </Button>
            </CardContent>
          </Card>

          {/* My Children */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Students ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students linked yet. Use the form on the left to add one.</p>
              ) : (
                <ul className="grid gap-2">
                  {children.map((c: any) => (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {c.name?.[0]?.toUpperCase() ?? "S"}
                      </span>
                      <span>{c.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Approvals ({pendingApprovals.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingApprovals.map((p: any) => (
                <Card key={p.id} className="border-yellow-500/40 bg-yellow-500/5">
                  <CardContent className="pt-4 grid gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{p.title ?? p.service_name ?? "Project Request"}</p>
                        <p className="text-xs text-muted-foreground">From: {p.child_name}</p>
                        {p.price != null && (
                          <p className="text-xs text-muted-foreground">Budget: ${p.price}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-500 shrink-0">Pending</Badge>
                    </div>
                    <Button size="sm" className="w-fit" onClick={() => handleApprove(p.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active Projects */}
        {projects.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">Active Projects</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project: any) => (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{project.service_name} <span className="text-muted-foreground font-normal text-sm">for {project.child_name}</span></span>
                      <Badge>{project.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Progress value={project.progress} />
                    <Timeline
                      items={[
                        { label: "Submitted", status: "done" },
                        { label: "Approved", status: "done" },
                        { label: "In Build", status: project.progress > 0 && project.progress < 100 ? "current" : "todo" },
                        { label: "Delivery", status: project.progress === 100 ? "done" : "todo" },
                      ]}
                    />
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/workspace/${project.id}`}>Open Workspace</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              No active projects yet. Once a student submits a request and you approve it, it will appear here.
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {notifications.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between text-sm">
                  <span>{n.message}</span>
                  <span className="text-muted-foreground text-xs">{n.createdAt}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    </AppShell>
  )
}
