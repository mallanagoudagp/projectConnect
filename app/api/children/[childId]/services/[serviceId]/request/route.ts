import { NextResponse } from "next/server"
import { demoStore } from "@/lib/demo-store"

export async function POST(req: Request, { params }: { params: { childId: string; serviceId: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const amount = Number(body?.amount ?? 99)
    const familyId = String(body?.familyId ?? "demo-family")

    const sub = demoStore.createSubscription({
      childId: params.childId,
      familyId,
      serviceId: params.serviceId,
      amount,
    })

    return NextResponse.json({ subscription: sub }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create request" }, { status: 500 })
  }
}
