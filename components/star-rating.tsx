"use client"

import { Star } from "lucide-react"
import { useState } from "react"

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const [hovered, setHovered] = useState(0)

  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-7 h-7" : "w-5 h-5"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(i)}
          onMouseEnter={() => !readOnly && setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className={readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
          aria-label={`${i} star`}
        >
          <Star
            className={[
              sizeClass,
              "transition-colors duration-100",
              i <= (hovered || value)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground",
            ].join(" ")}
          />
        </button>
      ))}
    </div>
  )
}
