"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Upload, FolderOpen, ImageIcon, FileText } from "lucide-react"

export default function BuilderUploadsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace("/auth/login")
    else if (role && role !== "builder") router.replace("/parent/dashboard")
  }, [authLoading, user, role, router])

  // Load builder's assigned projects
  useEffect(() => {
    if (authLoading || !user?.email) return
    apiFetch(`/dashboards/builder?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => {
        const activeProjects = d?.projects ?? []
        setProjects(activeProjects)
        if (activeProjects.length > 0) setSelectedProjectId(activeProjects[0].id)
        setLoadingProjects(false)
      })
      .catch(() => setLoadingProjects(false))
  }, [authLoading, user])

  // Load existing uploads when a project is selected
  useEffect(() => {
    if (!selectedProjectId) return
    apiFetch(`/workspaces/${selectedProjectId}/files`)
      .then(r => r.json())
      .then(d => setUploadedFiles(d?.files ?? []))
      .catch(() => setUploadedFiles([]))
  }, [selectedProjectId])

  async function handleUpload() {
    if (!selectedProjectId || files.length === 0) return
    setUploading(true)
    let successCount = 0
    try {
      for (const file of files) {
        // Convert file to base64 data URL for storage
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")
        const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`

        const res = await apiFetch(`/workspaces/${selectedProjectId}/files`, {
          method: "POST",
          body: JSON.stringify({
            file_name: file.name,
            file_url: dataUrl,
            uploader_role: "builder",
          }),
        })
        if (res.ok) successCount++
      }

      toast({
        title: `${successCount} file(s) uploaded`,
        description: "Files are now visible in the project workspace.",
      })
      setFiles([])

      // Refresh the file list
      const refreshed = await apiFetch(`/workspaces/${selectedProjectId}/files`).then(r => r.json())
      setUploadedFiles(refreshed?.files ?? [])
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || loadingProjects) {
    return (
      <AppShell role="builder">
        <div className="p-8 text-muted-foreground">Loading...</div>
      </AppShell>
    )
  }

  return (
    <AppShell role="builder">
      <div className="grid gap-6 max-w-3xl">
        <section className="grid gap-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Project Files
          </h1>
          <p className="text-muted-foreground">
            Share progress photos, videos, or documents with the student and parent.
          </p>
        </section>

        {/* Project selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Select Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active projects assigned to you yet. Projects appear here once a parent approves a student request and assigns you.
              </p>
            ) : (
              <div className="grid gap-2">
                {projects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`flex items-center justify-between w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      selectedProjectId === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{p.child_name}'s project</span>
                    <Badge variant={selectedProjectId === p.id ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload form — only show if a project is selected */}
        {selectedProjectId && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="upload-files">
                  Choose images, videos, or documents (max 10 MB each)
                </Label>
                <Input
                  id="upload-files"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </div>

              {files.length > 0 && (
                <ul className="grid gap-1 text-sm text-muted-foreground">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {f.type.startsWith("image/") ? (
                        <ImageIcon className="h-3 w-3 shrink-0" />
                      ) : (
                        <FileText className="h-3 w-3 shrink-0" />
                      )}
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs">({(f.size / 1024).toFixed(0)} KB)</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="w-fit"
              >
                {uploading ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length} file${files.length > 1 ? "s" : ""})` : ""}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Previously uploaded files */}
        {selectedProjectId && uploadedFiles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Previously Uploaded ({uploadedFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedFiles.map((f: any) => (
                  <div key={f.id} className="group relative rounded-lg border overflow-hidden bg-muted">
                    {f.file_url?.startsWith("data:image/") ? (
                      <img
                        src={f.file_url}
                        alt={f.file_name}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs p-2 truncate text-muted-foreground">{f.file_name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
