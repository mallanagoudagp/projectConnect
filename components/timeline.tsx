"use client"

import { Check } from "lucide-react"

type StepStatus = "done" | "current" | "todo"

interface TimelineItem {
  label: string
  status: StepStatus
}

export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <div className="flex items-start gap-0">
      {items.map((item, i) => {
        const done = item.status === "done"
        const current = item.status === "current"
        return (
          <div key={item.label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  done
                    ? "bg-primary border-primary shadow-sm"
                    : current
                      ? "bg-background border-primary ring-2 ring-primary/20"
                      : "bg-background border-border",
                ].join(" ")}
              >
                {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                {current && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </div>
              <span
                className={[
                  "text-[9px] font-semibold whitespace-nowrap leading-none",
                  done ? "text-primary" : current ? "text-primary" : "text-muted-foreground",
                ].join(" ")}
              >
                {item.label}
              </span>
            </div>

            {/* Connector line */}
            {i < items.length - 1 && (
              <div
                className={[
                  "h-0.5 w-7 mb-4 rounded-full transition-all duration-300",
                  done ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
