import { NextResponse } from "next/server"
import { demoStore } from "@/lib/demo-store"

// sharp is optional; if not available we skip thumbnail
let sharpAvailable = true
let sharp: any
try {
  // @ts-ignore
  sharp = await import("sharp")
} catch {
  sharpAvailable = false
}

export const runtime = "nodejs" // ensure we can use sharp if available

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")
    const mime = url.searchParams.get("mime") || "application/octet-stream"
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    const builderId = String(form.get("builderId") ?? "demo-builder")
    const subscriptionId = form.get("subscriptionId")?.toString()

    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })
    const arrayBuffer = await file.arrayBuffer()
    const size = arrayBuffer.byteLength

    if (mime.startsWith("video/") && size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Video too large (<= 50MB)" }, { status: 413 })
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${mime};base64,${base64}`

    let thumbDataUrl: string | undefined
    if (sharpAvailable && mime.startsWith("image/")) {
      try {
        const imgBuf = Buffer.from(arrayBuffer)
        const thumbBuf = await sharp(imgBuf).resize(360, 360, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer()
        const thumbB64 = thumbBuf.toString("base64")
        thumbDataUrl = `data:image/jpeg;base64,${thumbB64}`
      } catch {
        // ignore thumbnail errors
      }
    }

    const media = demoStore.addMedia({
      builderId,
      subscriptionId,
      mime,
      size,
      url: dataUrl,
      thumbnailUrl: thumbDataUrl,
    })

    return NextResponse.json({ media }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload failed" }, { status: 500 })
  }
}
