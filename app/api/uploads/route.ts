import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")
    const mime = url.searchParams.get("mime") || "application/octet-stream"
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    const subscriptionId = form.get("subscriptionId")?.toString()

    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })
    const arrayBuffer = await file.arrayBuffer()
    const size = arrayBuffer.byteLength

    if (mime.startsWith("video/") && size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Video too large (<= 50MB)" }, { status: 413 })
    }

    // Forward the upload to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000"
    const backendForm = new FormData()
    backendForm.append("file", new Blob([arrayBuffer], { type: mime }), file.name)
    if (subscriptionId) backendForm.append("subscription_id", subscriptionId)

    const response = await fetch(`${backendUrl}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: backendForm,
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ media: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload failed" }, { status: 500 })
  }
}

