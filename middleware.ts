import { type NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })

  // This lets you explore Parent/Student/Builder dashboards without logging in.
  // To re-enable auth later, remove this early return.
  return res
}
