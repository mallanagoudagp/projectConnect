"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Bell, Check, Loader2, RefreshCw } from "lucide-react"

type NotificationItem = {
  id: number
  message: string
  type?: string
  read: boolean
  created_at?: string
}

const roleLabels: Record<string, "parent" | "student" | "builder"> = {
  parent: "parent",
  student: "student",
  builder: "builder",
}

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Just now"
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const knownIds = useRef(new Set<number>())
  const hasLoaded = useRef(false)

  const loadNotifications = useCallback(async (silent = false) => {
    if (!user?.email) return
    if (!silent) setRefreshing(true)
    try {
      const response = await apiFetch(`/notifications?email=${encodeURIComponent(user.email)}`)
      const data = await response.json().catch(() => [])
      if (!response.ok) throw new Error(data.detail || `Could not load notifications (${response.status})`)

      const nextItems: NotificationItem[] = Array.isArray(data) ? data : []
      const newItems = hasLoaded.current
        ? nextItems.filter(item => !knownIds.current.has(item.id))
        : []
      knownIds.current = new Set(nextItems.map(item => item.id))
      setItems(nextItems)
      setError(null)
      hasLoaded.current = true

      if (newItems.length > 0) {
        toast({ title: "New notification", description: newItems[0].message })
      }
    } catch (loadError: any) {
      setError(loadError.message || "Could not load notifications.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast, user?.email])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    loadNotifications()
    const interval = window.setInterval(() => loadNotifications(true), 10000)
    return () => window.clearInterval(interval)
  }, [authLoading, loadNotifications, router, user])

  async function markRead(item: NotificationItem) {
    if (item.read) return
    const response = await apiFetch(`/notifications/${item.id}/read`, { method: "POST" })
    if (response.ok) {
      setItems(current => current.map(notification =>
        notification.id === item.id ? { ...notification, read: true } : notification
      ))
    } else {
      toast({ title: "Could not update notification", variant: "destructive" })
    }
  }

  const shellRole = roleLabels[role || ""]

  if (authLoading || loading) {
    return (
      <AppShell role={shellRole} showAuthActions>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role={shellRole} showAuthActions>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Updates about your projects, approvals, payments, and reviews.</p>
          </div>
          <button
            onClick={() => loadNotifications()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">New project and payment updates will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => markRead(item)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40 ${item.read ? "" : "bg-primary/5"}`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    {item.read ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.message}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                  </span>
                  {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
