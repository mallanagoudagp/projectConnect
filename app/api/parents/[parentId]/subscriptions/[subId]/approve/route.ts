import { NextResponse } from "next/server"
import { demoStore } from "@/lib/demo-store"

export async function POST(req: Request, { params }: { params: { parentId: string; subId: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const idempotencyKey = String(body?.idempotencyKey ?? `${params.parentId}:${params.subId}`)

    const res = demoStore.approveSubscription({
      subId: params.subId,
      parentId: params.parentId,
      idempotencyKey,
    })

    if (!res.ok) {
      return NextResponse.json({ error: res.message }, { status: res.status })
    }
    return NextResponse.json({ subscription: res.sub }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Approval failed" }, { status: 500 })
  }
}
