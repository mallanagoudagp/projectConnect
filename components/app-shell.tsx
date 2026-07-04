"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase/client"

const baseNav = [
  { href: "/parent/dashboard", label: "Dashboard" },
  { href: "/builders", label: "Builders" },
  { href: "/student/requests/new", label: "Request" },
  { href: "/notifications", label: "Notifications" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings", label: "Settings" },
]

const nav = (role: "parent" | "student" | "builder" | undefined) => {
  if (role === "builder") {
    return [...baseNav, { href: "/builder/uploads", label: "Uploads" }]
  }
  return baseNav
}

export function AppShell({
  children,
  role,
  showAuthActions = false,
}: {
  children: React.ReactNode
  role?: "parent" | "student" | "builder"
  showAuthActions?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  async function handleSignOut() {
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
      router.push("/")
    } catch {}
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/75 supports-[backdrop-filter]:bg-background/60 backdrop-blur transition-colors">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-primary hover:opacity-90 transition-opacity">
            BuildTrack
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav(role).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm transition-colors",
                  "text-foreground/80 hover:text-foreground hover:bg-muted/60",
                  pathname.startsWith(item.href) && "bg-muted text-foreground font-medium",
                )}
              >
                {item.label}
              </Link>
            ))}
            {/* Hide auth actions in exploration mode.
                When showAuthActions is true, render login/sign out as before. */}
            {showAuthActions ? (
              role ? (
                <>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/60">
                    {`Role: ${role}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="ml-2 bg-transparent hover:bg-muted/60"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    Login
                  </Link>
                  <Button asChild size="sm" className="hover:opacity-90 transition-opacity">
                    <Link href="/auth/signup" aria-label="Sign up">
                      Sign up
                    </Link>
                  </Button>
                </div>
              )
            ) : null}
          </nav>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-6 grid gap-2">
                  {nav(role).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-2 py-2 rounded-md transition-colors",
                        "text-foreground/80 hover:text-foreground hover:bg-muted/60",
                        pathname.startsWith(item.href) && "bg-muted text-foreground font-medium",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Separator className="my-2" />
                  {showAuthActions ? (
                    role ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{`Role: ${role}`}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSignOut}
                          className="hover:bg-muted/60 bg-transparent"
                        >
                          Sign out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href="/auth/login"
                          className="px-3 py-2 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          Login
                        </Link>
                        <Button asChild size="sm" className="hover:opacity-90 transition-opacity">
                          <Link href="/auth/signup">Sign up</Link>
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
