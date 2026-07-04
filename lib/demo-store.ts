// This is a singleton module used by API routes to persist demo data during preview

type UUID = string

export type SubscriptionStatus = "pending" | "active" | "cancelled"
export type PaymentStatus = "unpaid" | "paid"
export type NotificationType = "child_requested" | "subscription_approved" | "builder_update" | "media_uploaded"

export interface Subscription {
  id: UUID
  childId: string
  familyId: string
  serviceId: string
  amount: number
  status: SubscriptionStatus
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: UUID
  familyId: string
  type: NotificationType
  message: string
  createdAt: string
  data?: Record<string, unknown>
}

export interface Media {
  id: UUID
  builderId: string
  subscriptionId?: string
  mime: string
  size: number
  url: string // data URL for demo
  thumbnailUrl?: string // data URL for demo
  createdAt: string
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

class DemoStore {
  subscriptions: Subscription[] = []
  notifications: Notification[] = []
  media: Media[] = []
  // naive idempotency record
  charges = new Map<string, { id: string; status: "succeeded" }>()

  createSubscription(params: {
    childId: string
    familyId: string
    serviceId: string
    amount: number
  }) {
    const now = new Date().toISOString()
    const sub: Subscription = {
      id: uid(),
      childId: params.childId,
      familyId: params.familyId,
      serviceId: params.serviceId,
      amount: params.amount,
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
    }
    this.subscriptions.unshift(sub)
    this.addNotification({
      familyId: params.familyId,
      type: "child_requested",
      message: "New project request submitted",
      data: { subscriptionId: sub.id, serviceId: sub.serviceId, amount: sub.amount },
    })
    return sub
  }

  approveSubscription(params: {
    subId: string
    parentId: string
    idempotencyKey: string
  }) {
    const sub = this.subscriptions.find((s) => s.id === params.subId)
    if (!sub) {
      return { ok: false, status: 404 as const, message: "Subscription not found" }
    }
    if (sub.status !== "pending") {
      return { ok: false, status: 409 as const, message: "Already approved" }
    }

    // simulate payment gateway with idempotency
    if (!this.charges.has(params.idempotencyKey)) {
      this.charges.set(params.idempotencyKey, { id: uid(), status: "succeeded" })
    }

    sub.status = "active"
    sub.paymentStatus = "paid"
    sub.updatedAt = new Date().toISOString()

    this.addNotification({
      familyId: sub.familyId,
      type: "subscription_approved",
      message: "Project approved and payment succeeded",
      data: { subscriptionId: sub.id, amount: sub.amount, parentId: params.parentId },
    })

    return { ok: true, status: 200 as const, sub }
  }

  addNotification(n: { familyId: string; type: NotificationType; message: string; data?: Record<string, unknown> }) {
    const note: Notification = {
      id: uid(),
      familyId: n.familyId,
      type: n.type,
      message: n.message,
      createdAt: new Date().toISOString(),
      data: n.data,
    }
    this.notifications.unshift(note)
    return note
  }

  getNotifications(familyId: string) {
    return this.notifications.filter((n) => n.familyId === familyId)
  }

  addMedia(m: Omit<Media, "id" | "createdAt">) {
    const media: Media = { id: uid(), createdAt: new Date().toISOString(), ...m }
    this.media.unshift(media)
    // also drop a notification for family or builder preview
    this.notifications.unshift({
      id: uid(),
      familyId: "demo-family", // demo fallback
      type: "media_uploaded",
      message: "Builder uploaded new media",
      createdAt: new Date().toISOString(),
      data: { mediaId: media.id, subscriptionId: media.subscriptionId },
    })
    return media
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __demoStore: DemoStore | undefined
}

export const demoStore = globalThis.__demoStore ?? (globalThis.__demoStore = new DemoStore())
