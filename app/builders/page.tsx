"use client"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { Star, Search, SlidersHorizontal, Check, X, ArrowRight, Users, Loader2 } from "lucide-react"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  )
}

function BuilderCard({ b, selected, onToggleSelect }: any) {
  const [reviewsData, setReviewsData] = useState<any[]>([])

  function loadReviews() {
    apiFetch(`/reviews?builder_id=${b.id}`)
      .then(r => r.json())
      .then(d => setReviewsData(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden bt-card-hover flex flex-col transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      {/* Portfolio thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={b.image || `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(b.name + " builder portfolio")}`}
          alt={`${b.name} portfolio`}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Category badges overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {(b.categories || []).slice(0, 2).map((c: string) => (
            <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Builder info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-bold text-base">{b.name}</h3>
          {b.blurb && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.blurb}</p>}
        </div>

        {/* Credential strip */}
        <div className="pt-3 border-t border-border flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> Verified
          </span>
          <StarDisplay rating={b.rating ?? 0} />
          <span className="text-xs text-muted-foreground">{(b.rating ?? 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground ml-auto">{b.projects ?? 0} shipped</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          {/* Compare checkbox */}
          <button
            onClick={() => onToggleSelect(b.id)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              selected
                ? "bg-primary border-primary text-white"
                : "border-border hover:bg-muted/60"
            }`}
          >
            {selected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded" />}
            Compare
          </button>

          {/* Reviews dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                onClick={loadReviews}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 transition-all"
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                Reviews
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{b.name} — Reviews</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reviewsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
                ) : (
                  reviewsData.map((r: any, i: number) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{r.parent_name || "Anonymous"}</span>
                        <StarDisplay rating={r.rating} />
                      </div>
                      <p className="text-xs text-muted-foreground">{r.comment || r.body}</p>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Portfolio dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 transition-all">
                Portfolio
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{b.name} — Portfolio</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {(b.portfolio || []).map((src: string, i: number) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <Image
                      src={src || `/placeholder.svg?height=200&width=200&query=portfolio item`}
                      alt={`${b.name} work ${i + 1}`}
                      fill
                      sizes="33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                {(!b.portfolio || b.portfolio.length === 0) && (
                  <p className="col-span-3 text-sm text-muted-foreground text-center py-6">No portfolio images yet.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services */}
        {b.services?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            {b.services.slice(0, 2).map((s: any) => (
              <Link
                key={s.id}
                href={`/student/requests/new?builder_id=${b.id}&service_id=${s.id}`}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg hover:bg-primary/5 border border-border/60 hover:border-primary/30 transition-all group"
              >
                <div>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-muted-foreground ml-2">${s.price}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}

        {/* Main CTA */}
        <Link
          href={`/student/requests/new?builder_id=${b.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm mt-auto"
        >
          Request Offer <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function BuildersDirectory() {
  const [q, setQ] = useState("")
  const [rating, setRating] = useState("any")
  const [category, setCategory] = useState("any")
  const [selected, setSelected] = useState<number[]>([])
  const [builders, setBuilders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/builders")
      .then(res => res.json())
      .then(data => { setBuilders(data); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    return builders.filter(b => {
      const matchQ = q.trim().length === 0 || b.name.toLowerCase().includes(q.toLowerCase())
      const matchRating = rating === "any" || (b.rating ?? 0) >= Number(rating)
      const matchCat = category === "any" || (b.categories || []).includes(category)
      return matchQ && matchRating && matchCat
    })
  }, [q, rating, category, builders])

  function toggleSelected(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedBuilders = builders.filter(b => selected.includes(b.id))

  // Get all unique categories
  const allCategories = [...new Set(builders.flatMap(b => b.categories || []))]

  return (
    <AppShell showAuthActions>
      <div className="space-y-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Builders &amp; Services</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse verified builders, compare offers, and view portfolios.
            </p>
          </div>

          {/* Compare button */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  selected.length >= 2
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground cursor-not-allowed opacity-60"
                }`}
                disabled={selected.length < 2}
              >
                <Users className="w-4 h-4" />
                Compare ({selected.length})
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Compare Builders</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-y-auto">
                {selectedBuilders.map(b => (
                  <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold">{b.name}</h3>
                      <button onClick={() => toggleSelected(b.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rating</span>
                        <div className="flex items-center gap-1.5"><StarDisplay rating={b.rating} /><span>{(b.rating ?? 0).toFixed(1)}</span></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Projects Completed</span>
                        <span className="font-semibold">{b.projects ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Categories</span>
                        <span className="text-right text-xs">{(b.categories || []).join(", ")}</span>
                      </div>
                      {b.blurb && <p className="text-muted-foreground text-xs pt-2 border-t border-border">{b.blurb}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* ── FILTER SIDEBAR ── */}
          <aside className="md:col-span-1 bg-card border border-border rounded-2xl p-4 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                id="q"
                placeholder="Search builders..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Rating filter */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Min Rating</label>
              <div className="space-y-1">
                {[
                  { value: "any", label: "Any rating" },
                  { value: "4", label: "4.0+ ⭐" },
                  { value: "4.5", label: "4.5+ ⭐" },
                  { value: "4.8", label: "4.8+ ⭐" },
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRating(r.value)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rating === r.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {["any", ...allCategories.slice(0, 6)].map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                      category === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {c === "any" ? "All" : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
              {filtered.length} builder{filtered.length !== 1 ? "s" : ""} shown
            </div>
          </aside>

          {/* ── BUILDER CARDS GRID ── */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading builders…</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-center">
                <div>
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium">No builders match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(b => (
                  <BuilderCard
                    key={b.id}
                    b={b}
                    selected={selected.includes(b.id)}
                    onToggleSelect={toggleSelected}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
