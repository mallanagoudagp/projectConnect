"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function NewRequestPage() {
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [budget, setBudget] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const { toast } = useToast()

  async function onSubmit() {
    try {
      if (!title || !budget) {
        toast({ title: "Missing info", description: "Please add a title and budget.", variant: "destructive" })
        return
      }
      setSubmitting(true)
      setOverallProgress(10)

      // 1) Create subscription (Child -> API -> DB (demo))
      const familyId = "demo-family"
      const childId = "child_demo"
      const serviceId = "science_fair"
      const createRes = await fetch(`/api/children/${childId}/services/${serviceId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, amount: Number(budget), title, description: desc }),
      })
      if (!createRes.ok) throw new Error("Failed to create request")
      const { subscription } = await createRes.json()
      setOverallProgress(35)

      // 2) Upload reference files (presign -> upload)
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const presign = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mime: f.type || "application/octet-stream" }),
        }).then((r) => r.json())

        const fd = new FormData()
        fd.append("file", f)
        fd.append("builderId", "demo-builder") // demo metadata
        fd.append("subscriptionId", subscription.id)

        await fetch(presign.uploadUrl, { method: "POST", body: fd }).then((r) => r.json())
        setOverallProgress(35 + Math.round(((i + 1) / Math.max(files.length, 1)) * 55))
      }

      setOverallProgress(100)
      toast({
        title: "Request submitted",
        description: files.length
          ? `Your request was created and ${files.length} reference file(s) uploaded.`
          : "Your request was created.",
      })
      // reset
      setTitle("")
      setDesc("")
      setBudget("")
      setFiles([])
      setTimeout(() => setOverallProgress(0), 800)
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? "Please try again.", variant: "destructive" })
      setOverallProgress(0)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell role="student">
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
