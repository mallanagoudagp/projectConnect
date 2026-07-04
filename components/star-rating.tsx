"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 18,
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: number
}) {
  const [hover, setHover] = React.useState<number | null>(null)
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${value} out of 5`}>
      {stars.map((s) => {
        const active = (hover ?? value) >= s
        return (
          <button
            key={s}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(s)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => onChange && onChange(s)}
            className={cn("disabled:cursor-default")}
            aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(active ? "fill-primary text-primary" : "text-muted-foreground")}
            />
          </button>
        )
      })}
    </div>
  )
}
