import { NextResponse } from "next/server"
import { demoStore } from "@/lib/demo-store"

export async function GET(_req: Request, { params }: { params: { familyId: string } }) {
  const list = demoStore.getNotifications(params.familyId)
  return NextResponse.json({ notifications: list }, { status: 200 })
}
