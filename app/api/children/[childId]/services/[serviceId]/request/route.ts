import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { childId: string; serviceId: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const amount = Number(body?.amount ?? 99)
    const familyId = String(body?.familyId ?? "")

    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000"
    const response = await fetch(`${backendUrl}/workspaces/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(body?.token ? { Authorization: `Bearer ${body.token}` } : {}),
      },
      body: JSON.stringify({
        child_id: params.childId,
        service_id: params.serviceId,
        family_id: familyId,
        amount,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ subscription: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create request" }, { status: 500 })
  }
}
