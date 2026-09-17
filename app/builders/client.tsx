"use client"

import { AppShell } from "@/components/app-shell"
import { StarRating } from "@/components/star-rating"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

// Demo data removed, now fetching from API

export default function BuildersDirectory() {
  const [q, setQ] = useState("")
  const [rating, setRating] = useState<string>("any")
  const [category, setCategory] = useState<string>("any")
  const [selected, setSelected] = useState<number[]>([])

  const [builders, setBuilders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/builders")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setBuilders(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load builders:", err)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return builders.filter((b) => {
      const matchQ = q.trim().length === 0 || b.name.toLowerCase().includes(q.toLowerCase())
      const matchRating = rating === "any" || b.rating >= Number(rating)
      const matchCat = category === "any" || b.categories.includes(category)
      return matchQ && matchRating && matchCat
    })
  }, [builders, q, rating, category])

  function toggleSelected(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectedBuilders = builders.filter((b) => selected.includes(b.id))

  const { role } = useAuth()

  return (
    // builders-theme keeps the scoped palette token overrides explicit even though
    // they're already active globally via body in layout.tsx.
    <div className="builders-theme">
      <AppShell role={role as any}>
        <div className="grid gap-8">

          {/* ── Page header ─────────────────────────────────────────────────── */}
          <section className="flex items-start justify-between gap-6">
            <div className="grid gap-2">
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: "var(--bt-ink)",
                  fontWeight: 400,
                }}
              >
                Builders &amp; Services
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                  fontSize: "1.0625rem",
                  lineHeight: 1.6,
                  color: "var(--bt-chalk)",
                }}
              >
                Browse verified builders, compare offers, and view portfolios.
              </p>
            </div>

            {/* Compare sheet — unchanged logic */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  disabled={selected.length < 2}
                  style={{
                    fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Compare ({selected.length})
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-xl"
                style={{
                  background: "var(--bt-paper)",
                  color: "var(--bt-ink)",
                  fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                }}
              >
                <SheetHeader>
                  <SheetTitle style={{ color: "var(--bt-ink)" }}>Compare builders</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid gap-4">
                  {selectedBuilders.length < 2 ? (
                    <p className="text-sm" style={{ color: "var(--bt-chalk)" }}>
                      Select at least two builders to compare.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedBuilders.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor: "var(--border)", background: "var(--bt-paper)" }}
                        >
                          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--bt-ink)" }}>{b.name}</p>
                          </div>
                          <div className="px-4 py-3 grid gap-2 text-sm" style={{ color: "var(--bt-ink)" }}>
                            <div className="flex items-center justify-between">
                              <span>Rating</span>
                              <span style={{ color: "var(--bt-chalk)" }}>{b.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Completed</span>
                              <span style={{ color: "var(--bt-chalk)" }}>{b.projects}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Categories</span>
                              <span style={{ color: "var(--bt-chalk)" }}>{b.categories.join(", ")}</span>
                            </div>
                            <p style={{ color: "var(--bt-chalk)" }}>{b.blurb}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </section>

          {/* ── Main layout: filter sidebar + builder grid ───────────────────── */}
          <section className="grid gap-6 md:grid-cols-4">

            {/* Filter sidebar — form-pad feel, no card border */}
            <aside
              className="md:col-span-1 grid gap-5 h-fit"
              style={{ fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
            >
              {/* "Filter" label */}
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--bt-chalk)",
                }}
              >
                Filter
              </p>

              <div className="grid gap-1.5">
                <Label
                  htmlFor="q"
                  style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--bt-ink)" }}
                >
                  Search
                </Label>
                <Input
                  id="q"
                  placeholder="Builder name…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    background: "var(--bt-ledger)",
                    border: "1px solid var(--border)",
                    color: "var(--bt-ink)",
                    fontSize: "0.9375rem",
                    fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                  }}
                />
              </div>

              <div className="grid gap-1.5">
                <Label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--bt-ink)" }}>
                  Rating
                </Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger
                    style={{
                      background: "var(--bt-ledger)",
                      border: "1px solid var(--border)",
                      color: "var(--bt-ink)",
                      fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                    }}
                  >
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--bt-paper)", color: "var(--bt-ink)" }}>
                    <SelectItem value="any">Any rating</SelectItem>
                    <SelectItem value="4">4.0+ stars</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="4.8">4.8+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--bt-ink)" }}>
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    style={{
                      background: "var(--bt-ledger)",
                      border: "1px solid var(--border)",
                      color: "var(--bt-ink)",
                      fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                    }}
                  >
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--bt-paper)", color: "var(--bt-ink)" }}>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="models">Models</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="craft">Craft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thin ruled separator */}
              <div
                style={{ height: "1px", background: "var(--border)", marginTop: "0.25rem" }}
                aria-hidden
              />

              {/* Result count */}
              {!loading && (
                <p style={{ fontSize: "0.8125rem", color: "var(--bt-chalk)" }}>
                  {filtered.length} builder{filtered.length !== 1 ? "s" : ""} shown
                </p>
              )}
            </aside>

            {/* ── Builder card grid ─────────────────────────────────────────── */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading && (
                <div
                  className="sm:col-span-2 lg:col-span-3 py-16 text-center"
                  style={{ color: "var(--bt-chalk)", fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
                >
                  Loading builders…
                </div>
              )}

              {!loading && filtered.map((b) => (
                <BuilderCard
                  key={b.id}
                  builder={b}
                  isSelected={selected.includes(b.id)}
                  onToggleSelect={() => toggleSelected(b.id)}
                />
              ))}

              {!loading && filtered.length === 0 && builders.length === 0 && (
                <div
                  className="sm:col-span-2 lg:col-span-3 py-16 text-center"
                  style={{
                    color: "var(--bt-chalk)",
                    fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                  }}
                >
                  No builders found. Make sure the backend server is running.
                </div>
              )}

              {!loading && filtered.length === 0 && builders.length > 0 && (
                <div
                  className="sm:col-span-2 lg:col-span-3 py-16 text-center"
                  style={{
                    color: "var(--bt-chalk)",
                    fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                  }}
                >
                  No builders match your filters.
                </div>
              )}
            </div>
          </section>
        </div>
      </AppShell>
    </div>
  )
}

// ─── Builder card — signature Credential Strip component ──────────────────────
function BuilderCard({
  builder: b,
  isSelected,
  onToggleSelect,
}: {
  builder: any
  isSelected: boolean
  onToggleSelect: () => void
}) {
  const { role } = useAuth()

  const fallbackImage = (id: number) => {
    const defaultImages = [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80"
    ]
    return defaultImages[id % defaultImages.length]
  }

  const imageSrc = (!b.image || b.image.startsWith("/placeholder")) ? fallbackImage(b.id || 0) : b.image

  const portfolioList = (b.portfolio && b.portfolio.length > 0 && !b.portfolio[0].startsWith("/placeholder"))
    ? b.portfolio
    : [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80"
      ]

  return (
    <article
      className="bt-card rounded-xl overflow-hidden"
      style={{
        background: "var(--bt-paper)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
      aria-label={`Builder: ${b.name}`}
    >
      {/* Work zone — portfolio image */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "12 / 7" }}>
        <Image
          src={imageSrc}
          alt={`${b.name} portfolio preview`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Work zone — name + categories */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--bt-ink)",
            lineHeight: 1.3,
            marginBottom: "0.5rem",
          }}
        >
          {b.name}
        </h2>

        {/* Category badges — outline only, no fill */}
        {b.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.categories.map((c: string) => (
              <span
                key={c}
                style={{
                  display: "inline-block",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  color: "var(--bt-chalk)",
                  fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Credential strip — the signature element ───────────────────────── */}
      {/* Thin chalk/30 horizontal rule */}
      <div
        style={{ height: "1px", background: "rgba(90, 83, 72, 0.25)", margin: "0 1rem" }}
        aria-hidden
      />

      <div
        className="px-4 py-3 flex flex-col gap-3"
        style={{
          background: "var(--bt-ledger)",
          fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
          flexGrow: 1,
        }}
      >
        {/* Verified stamp + rating */}
        <div className="flex items-center justify-between gap-2">
          {/* Verified stamp */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--bt-verified)",
            }}
            aria-label="Verified builder"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <circle cx="7" cy="7" r="6.5" stroke="var(--bt-verified)" strokeWidth="1.25" />
              <path
                d="M4.5 7L6.2 8.75L9.5 5.25"
                stroke="var(--bt-verified)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified
          </span>

          {/* Star rating + numeric */}
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(b.rating)} readOnly size={14} />
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--bt-ink)",
              }}
            >
              {b.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Projects shipped — spec-sheet number */}
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              fontSize: "1.375rem",
              fontWeight: 600,
              color: "var(--bt-ink)",
              lineHeight: 1,
            }}
          >
            {b.projects}
          </span>
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--bt-chalk)",
            }}
          >
            projects shipped
          </span>
        </div>

        {/* Compare checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`cmp-${b.id}`}
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${b.name} for comparison`}
          />
          <Label
            htmlFor={`cmp-${b.id}`}
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--bt-chalk)",
              cursor: "pointer",
            }}
          >
            Compare
          </Label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <BuilderReviewsDialog builderId={b.id} builderName={b.name} />
          <Dialog>
            <DialogTrigger asChild>
              <button
                style={{
                  flex: 1,
                  padding: "0.375rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--bt-ink)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                }}
              >
                View portfolio
              </button>
            </DialogTrigger>
            <DialogContent
              className="max-w-3xl"
              style={{ background: "var(--bt-paper)", color: "var(--bt-ink)" }}
            >
              <DialogHeader>
                <DialogTitle style={{ color: "var(--bt-ink)", fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}>
                  {b.name} — Portfolio
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {portfolioList.map((src: string, i: number) => (
                  <div key={i} className="relative overflow-hidden rounded-md" style={{ aspectRatio: "12/7", border: "1px solid var(--border)" }}>
                    <Image
                      src={src}
                      alt={`${b.name} portfolio item ${i + 1}`}
                      fill
                      sizes="(min-width: 768px) 20vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Offered services — if any */}
        {b.services?.length > 0 && (
          <div
            className="mt-1 grid gap-2"
            style={{
              paddingTop: "0.75rem",
              borderTop: "1px solid rgba(90, 83, 72, 0.2)",
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--bt-chalk)",
                marginBottom: "0.25rem",
              }}
            >
              Services
            </p>
            {b.services.map((s: any) => (
              <div
                key={s.id || s.type}
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(90, 83, 72, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ background: "rgba(245, 240, 232, 0.6)" }}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--bt-ink)" }}>
                    {s.type}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--bt-chalk)" }}>
                    ${s.price}
                  </span>
                </div>
                <a
                  href={`/student/requests/new?serviceId=${s.id ?? ""}&builderId=${b.id}&builderName=${encodeURIComponent(b.name)}&serviceType=${encodeURIComponent(s.type)}&servicePrice=${s.price}`}
                  style={{
                    display: "block",
                    padding: "0.375rem 0.75rem",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--bt-blueprint)",
                    background: "transparent",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                  }}
                >
                  {role === "parent" ? "Request for Student →" : "Request this service →"}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* No services — custom project CTA */}
        {(!b.services || b.services.length === 0) && (
          <a
            href={`/student/requests/new?builderId=${b.id}&builderName=${encodeURIComponent(b.name)}`}
            style={{
              display: "block",
              padding: "0.5rem 1rem",
              textAlign: "center",
              borderRadius: "6px",
              border: "1.5px solid var(--bt-blueprint)",
              color: "var(--bt-blueprint)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
              marginTop: "0.25rem",
            }}
          >
            {role === "parent" ? "Request Custom Project for Student" : "Request Custom Project"}
          </a>
        )}
      </div>
    </article>
  )
}

// ─── Reviews dialog ───────────────────────────────────────────────────────────
function BuilderReviewsDialog({ builderId, builderName }: { builderId: number; builderName: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      apiFetch(`/reviews?builder_id=${builderId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          if (Array.isArray(data)) setReviews(data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, builderId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          style={{
            flex: 1,
            padding: "0.375rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid var(--bt-blueprint)",
            background: "transparent",
            color: "var(--bt-blueprint)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
          }}
        >
          Reviews
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xl max-h-[80vh] overflow-y-auto"
        style={{ background: "var(--bt-paper)", color: "var(--bt-ink)" }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              color: "var(--bt-ink)",
              fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
            }}
          >
            {builderName} — Reviews
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 mt-2">
          {loading ? (
            <p style={{ fontSize: "0.875rem", color: "var(--bt-chalk)" }}>Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--bt-chalk)" }}>
              This builder has no reviews yet.
            </p>
          ) : (
            reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-lg p-4"
                style={{
                  background: "var(--bt-ledger)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-ibm-plex), system-ui, sans-serif",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--bt-ink)" }}>
                    {r.parent_name}
                  </span>
                  <StarRating value={r.rating} readOnly size={14} />
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--bt-chalk)", fontStyle: "italic" }}>
                  "{r.comment}"
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--bt-chalk)", marginTop: "0.5rem" }}>
                  {r.project_title} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
