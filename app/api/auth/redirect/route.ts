import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  const url = new URL(request.url)

  // Using SSR client ensures we read the same cookies the middleware sees
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          // Next API Route: read cookie from request.headers
          const cookie = request.headers.get("cookie") || ""
          const match = cookie.match(new RegExp(`${name}=([^;]+)`))
          return match ? decodeURIComponent(match[1]) : undefined
        },
        // no-ops for API route
        set: () => {},
        remove: () => {},
      },
    },
  )

  const { data } = await supabase.auth.getUser()
  const role = (data.user?.user_metadata?.role as "parent" | "student" | "builder" | undefined) ?? "parent"

  const dest =
    role === "builder" ? "/builder/dashboard" : role === "student" ? "/student/dashboard" : "/parent/dashboard"

  return NextResponse.json({ dest }, { headers: { "cache-control": "no-store" } })
}
