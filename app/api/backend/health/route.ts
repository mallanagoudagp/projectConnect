export const runtime = "nodejs"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return Response.json(
        { status: "failed", backend: BACKEND_URL },
        { status: 503 }
      )
    }

    const data = await response.json().catch(() => ({ status: "ok" }))
    return Response.json({ status: "ok", backend: BACKEND_URL, data })
  } catch {
    return Response.json(
      { status: "failed", backend: BACKEND_URL },
      { status: 503 }
    )
  }
}