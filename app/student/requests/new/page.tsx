"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewRequestPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [budget, setBudget] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [builders, setBuilders] = useState<any[]>([])
  const [builderId, setBuilderId] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>("")
  const [loadingBuilders, setLoadingBuilders] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/auth/login"); return }
    if (role !== "student") { router.replace(role === "parent" ? "/parent/dashboard" : "/builder/dashboard"); return }

    const params = new URLSearchParams(window.location.search)
    const preselectedBuilder = params.get("builderId") || params.get("builder_id")
    const preselectedService = params.get("serviceId") || params.get("service_id")
    if (preselectedBuilder) setBuilderId(preselectedBuilder)
    if (preselectedService) setServiceId(preselectedService)

    apiFetch("/builders")
      .then(async res => {
        if (!res.ok) throw new Error(`Could not load builders (${res.status})`)
        return res.json()
      })
      .then(data => setBuilders(Array.isArray(data) ? data : []))
      .catch(error => toast({ title: "Builders unavailable", description: error.message, variant: "destructive" }))
      .finally(() => setLoadingBuilders(false))
  }, [authLoading, user, role, router, toast])

  async function onSubmit() {
    try {
      if (!title.trim() || !desc.trim() || budget === "" || Number(budget) <= 0) {
        toast({ title: "Missing info", description: "Add a title, description, and budget greater than zero.", variant: "destructive" })
        return
      }
      setSubmitting(true)
      setOverallProgress(10)

      // Submit to real FastAPI backend
      const res = await apiFetch("/project-requests", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: desc.trim(),
          budget: Number(budget),
          builder_id: builderId ? Number(builderId) : null,
          service_id: serviceId ? Number(serviceId) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Submission failed" }))
        throw new Error(err?.detail ?? "Submission failed")
      }

      setOverallProgress(100)
      toast({
        title: "Request submitted!",
        description: "Your parent will be notified and can approve it from their dashboard.",
      })

      // reset form
      setTitle("")
      setDesc("")
      setBudget("")
      setFiles([])
      setBuilderId("")
      setServiceId("")
      setTimeout(() => setOverallProgress(0), 800)
      router.push("/student/dashboard")
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? "Please try again.", variant: "destructive" })
      setOverallProgress(0)
    } finally {
      setSubmitting(false)
    }
  }


  if (authLoading || !user || role !== "student") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <AppShell role="student" showAuthActions>
      <Card className="max-w-3xl transition-shadow duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Submit a Project Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Project title</Label>
            <Input
              id="title"
              placeholder="e.g. Solar system model"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Describe what you need help with..."
              className="min-h-32"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g. 150"
              value={budget}
              onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="builder">Builder</Label>
            <select
              id="builder"
              value={builderId}
              onChange={(e) => setBuilderId(e.target.value)}
              disabled={loadingBuilders}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Global Marketplace (Any Builder)</option>
              {builders.map((builder) => (
                <option key={builder.id} value={builder.id}>{builder.name} {builder.rating ? `· ${Number(builder.rating).toFixed(1)} stars` : ""}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Choose a builder directly or leave it open for the verified marketplace.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="files">Upload references (images/videos)</Label>
            <Input id="files" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            {files.length > 0 && (
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {files.map((f, i) => (
                  <li key={i} className="truncate">
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {overallProgress > 0 && <Progress value={overallProgress} />}
          <Button className="w-fit" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
