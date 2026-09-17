"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StarRating } from "@/components/star-rating"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { SkeletonCard } from "@/components/skeleton-card"
import { EmptyState, StarEmptyIcon } from "@/components/empty-state"

interface Review {
  id: number
  rating: number
  comment: string
  created_at: string
  project_title: string
  parent_name: string
}

export default function BuilderReviewsPage() {
  const { role } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== "builder") return
    
    apiFetch("/reviews")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [role])

  return (
    <RoleGuard allowedRoles={["builder"]}>
      <AppShell role="builder">
        <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
          <h1 className="text-3xl mb-2">My Reviews</h1>
          <p className="text-muted-foreground mb-8">View feedback from parents about your completed projects.</p>
          
          {loading ? (
            <div className="grid gap-4">
              <SkeletonCard rows={3} />
              <SkeletonCard rows={3} />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<StarEmptyIcon />}
              title="No reviews yet"
              description="Once a parent approves and rates a completed project, their feedback will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{r.project_title || "Project"}</CardTitle>
                        <CardDescription>Reviewed by {r.parent_name}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} readOnly />
                        <span className="text-sm font-medium">{r.rating}/5</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{r.comment || "No comment provided."}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </AppShell>
    </RoleGuard>
  )
}
