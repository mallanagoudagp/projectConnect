import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * EmptyState — consistent zero-data presentation across the app.
 * Renders a small inline SVG icon, a heading, descriptive copy, and an optional CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 px-6 text-center gap-3",
        className
      )}
    >
      {icon && (
        <div
          className="mb-1 opacity-30"
          style={{ color: "var(--bt-chalk, #5A5348)" }}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p
        className="font-semibold text-foreground"
        style={{ fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
      >
        {title}
      </p>
      <p
        className="text-sm text-muted-foreground max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
      >
        {description}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/* ── Preset icons (inline SVGs, no external dep) ──────────────── */

export function FolderEmptyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12C6 10.343 7.343 9 9 9h8l3 4h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a3 3 0 0 1-3-3V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 22h12M14 26h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function BellEmptyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8a7 7 0 0 1 7 7v5l2.5 4.5H10.5L13 20v-5a7 7 0 0 1 7-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M17.5 25v1a2.5 2.5 0 0 0 5 0v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function StarEmptyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8l3.09 6.26L30 15.27l-5 4.87 1.18 6.88L20 23.77l-6.18 3.25L15 20.14 10 15.27l6.91-1.01L20 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

export function InboxEmptyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="10" width="26" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 26h6l3 3 3-3h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 17h12M14 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
