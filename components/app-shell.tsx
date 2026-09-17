"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Menu, Bell, LogOut, ChevronRight, Home, Users, Plus, Upload, Star, Settings, CreditCard, Globe } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useState } from "react"

const parentNav = [
  { href: "/parent/dashboard", label: "Dashboard", icon: Home },
  { href: "/builders", label: "Builders", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
]

const studentNav = [
  { href: "/student/dashboard", label: "Dashboard", icon: Home },
  { href: "/builders", label: "Builders", icon: Users },
  { href: "/student/requests/new", label: "Request", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
]

const builderNav = [
  { href: "/builder/dashboard", label: "Dashboard", icon: Home },
  { href: "/builder/uploads", label: "Uploads", icon: Upload },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
]

const roleConfig = {
  parent:  { label: "Parent",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" },
  student: { label: "Student", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", dot: "bg-emerald-500" },
  builder: { label: "Builder", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-500" },
}

const nav = (role: "parent" | "student" | "builder" | undefined) => {
  if (role === "builder") return builderNav
  if (role === "student") return studentNav
  return parentNav
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
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
      router.push("/")
    } catch {}
  }

  const navItems = nav(role)
  const rc = role ? roleConfig[role] : null

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bt-glass transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              Build<span className="text-primary">Track</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {rc && (
              <span className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full", rc.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", rc.dot)} />
                {rc.label}
              </span>
            )}
            {showAuthActions && role && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            )}
            {showAuthActions && !role && (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted/60 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 bg-background border-border">
                {/* Mobile sheet header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-white font-bold text-sm">BT</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                      Build<span className="text-primary">Track</span>
                    </span>
                  </div>
                  {rc && (
                    <span className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full", rc.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", rc.dot)} />
                      {rc.label}
                    </span>
                  )}
                </div>

                {/* Mobile nav items */}
                <div className="p-3 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                      </Link>
                    )
                  })}
                </div>

                {/* Mobile sign out */}
                {showAuthActions && role && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
                {showAuthActions && !role && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm border border-border hover:bg-muted/60 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
