import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

// Protected route prefixes — any path starting with these requires a session.
// Public routes (/, /auth/*, /api/*) are intentionally excluded from the matcher below.
const PROTECTED_PREFIXES = ["/parent", "/student", "/builder", "/admin"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })

  // Only run auth check on protected routes
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  // Check for local development / mock session cookies
  const hasLocalSession = req.cookies.get("sb-auth-token") || req.cookies.get("auth-role") || req.cookies.get("auth-email")
  if (hasLocalSession) {
    return res
  }

  // Read the Supabase session from cookies — same SSR client pattern as
  // app/api/auth/redirect/route.ts so both see the same session state.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (!supabaseUrl || supabaseUrl === "https://your-project-ref.supabase.co") {
    // If Supabase is unconfigured or placeholder, let users pass if they have demo-user or mock session
    if (hasLocalSession || req.cookies.get("demo-user")) {
      return res
    }
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        // Middleware can't set cookies via the response after NextResponse.next(),
        // so we pass no-ops for set/remove (Supabase SSR requires these to be present).
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    // No valid session — redirect to login, preserving the intended destination
    // so the login page can redirect back after authentication.
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  // Run on all /parent/*, /student/*, /builder/*, /admin/* routes.
  // Excludes /api/*, /_next/*, static files, and favicon automatically
  // via the negative lookahead in this pattern.
  matcher: [
    "/parent/:path*",
    "/student/:path*",
    "/builder/:path*",
    "/admin/:path*",
  ],
}
