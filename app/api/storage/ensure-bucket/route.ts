import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing Supabase server env" }, { status: 500 })
  }
  const supa = createClient(url, key)
  // create if not exists (idempotent)
  const { data: buckets } = await supa.storage.listBuckets()
  const exists = (buckets || []).some((b) => b.name === "project-uploads")
  if (!exists) {
    const { error } = await supa.storage.createBucket("project-uploads", { public: true })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
