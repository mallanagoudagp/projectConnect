"use client"

import { useState } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

const NAV_LINKS = [
  { href: "/builders", label: "Builders" },
  { href: "/reviews", label: "Reviews" },
  { href: "/auth/login", label: "Login" },
]

/**
 * MobileNav — sheet-based hamburger menu for the public landing page header.
 * Isolated as a client component so app/page.tsx stays a Server Component.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 pt-12">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t mt-2 pt-3">
              <Button asChild className="w-full">
                <Link href="/auth/signup" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
