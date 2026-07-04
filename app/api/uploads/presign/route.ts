// In production, replace with S3 or Supabase Storage signed URL generation.
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const mime = String(body?.mime ?? "image/png")
  const token = Math.random().toString(36).slice(2)
  const uploadUrl = `/api/uploads?token=${token}&mime=${encodeURIComponent(mime)}`
  return NextResponse.json({ uploadUrl, token }, { status: 200 })
}
