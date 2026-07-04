import { NextResponse } from "next/server"
import { demoStore } from "@/lib/demo-store"

export async function GET(req: Request, { params }: { params: { familyId: string } }) {
  const url = new URL(req.url)
  const status = url.searchParams.get("status") as ("pending" | "active" | "cancelled") | null
  const list = demoStore.subscriptions.filter((s) => s.familyId === params.familyId && (!status || s.status === status))
  return NextResponse.json({ subscriptions: list }, { status: 200 })
}
