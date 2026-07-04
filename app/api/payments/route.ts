export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { requestId, amount } = body || {}
  // simulate processing time
  await new Promise((r) => setTimeout(r, 900))
  const res = {
    status: "succeeded",
    paymentId: `pay_${Math.random().toString(36).slice(2, 9)}`,
    requestId,
    amount,
    processedAt: new Date().toISOString(),
  }
  return Response.json(res)
}
