export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { type, project } = body || {}
  await new Promise((r) => setTimeout(r, 600))
  return Response.json({
    ok: true,
    message: `${type === "cancel" ? "Cancellation" : "Refund"} for "${project}" received.`,
  })
}
