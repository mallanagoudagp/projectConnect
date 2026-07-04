"use client"

import { AppShell } from "@/components/app-shell"
import { StarRating } from "@/components/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useMemo, useState } from "react"

// Demo data removed, now fetching from API

export default function BuildersDirectory() {
  const [q, setQ] = useState("")
  const [rating, setRating] = useState<string>("any")
  const [category, setCategory] = useState<string>("any")
  const [selected, setSelected] = useState<number[]>([])
  
  const [builders, setBuilders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    fetch('http://localhost:8000/builders')
      .then(res => res.json())
      .then(data => {
        setBuilders(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
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
  }, [q, rating, category])

  function toggleSelected(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectedBuilders = builders.filter((b) => selected.includes(b.id))

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Builders & Services</h1>
            <p className="text-muted-foreground">Browse verified builders, compare offers, and view portfolios.</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" disabled={selected.length < 2}>
                Compare ({selected.length})
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Compare builders</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-4">
                {selectedBuilders.length < 2 ? (
                  <p className="text-sm text-muted-foreground">Select at least two builders to compare.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedBuilders.map((b) => (
                      <Card key={b.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{b.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Rating</span>
                            <span className="text-muted-foreground">{b.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Completed</span>
                            <span className="text-muted-foreground">{b.projects}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Categories</span>
                            <span className="text-muted-foreground">{b.categories.join(", ")}</span>
                          </div>
                          <div className="text-muted-foreground">{b.blurb}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <aside className="md:col-span-1 grid gap-4 h-fit rounded-lg border p-4 bg-card">
            <div className="grid gap-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" placeholder="Search builders..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any rating</SelectItem>
                  <SelectItem value="4">4.0+ stars</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                  <SelectItem value="4.8">4.8+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="models">Models</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="craft">Craft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <div className="relative aspect-[12/7] w-full overflow-hidden">
                  <Image
                    src={b.image || "/placeholder.svg?height=140&width=240&query=builder%20portfolio"}
                    alt={`${b.name} portfolio`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{b.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <StarRating value={Math.round(b.rating)} readOnly />
                    <Badge variant="secondary">{b.rating.toFixed(1)}</Badge>
                  </div>
                  <div className="text-muted-foreground">{b.projects} completed projects</div>
                  <div className="flex flex-wrap gap-2">
                    {b.categories.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`cmp-${b.id}`}
                        checked={selected.includes(b.id)}
                        onCheckedChange={() => toggleSelected(b.id)}
                      />
                      <Label htmlFor={`cmp-${b.id}`} className="text-xs">
                        Compare
                      </Label>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View portfolio
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{b.name} portfolio</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {b.portfolio.map((src, i) => (
                            <div key={i} className="relative aspect-[12/7] overflow-hidden rounded-md border">
                              <Image
                                src={src || "/placeholder.svg?height=140&width=240&query=portfolio%20item"}
                                alt={`${b.name} item ${i + 1}`}
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

                  <Button className="w-full" asChild>
                    <a href="/student/requests/new">Request offer</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="md:col-span-3 text-center text-sm text-muted-foreground py-10">
                No builders match your filters.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
