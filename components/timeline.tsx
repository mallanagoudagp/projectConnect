import { cn } from "@/lib/utils"

export function Timeline({
  items,
  className,
}: {
  items: { label: string; status?: "done" | "current" | "todo" }[]
  className?: string
}) {
  return (
    <ol className={cn("grid grid-cols-1 sm:grid-cols-4 gap-4", className)}>
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center gap-3">
          <span
            className={cn(
              "h-3 w-3 rounded-full",
              item.status === "done" && "bg-accent",
              item.status === "current" && "bg-primary",
              (!item.status || item.status === "todo") && "bg-muted",
            )}
            aria-hidden
          />
          <span className={cn("text-sm", item.status === "todo" && "text-muted-foreground")}>{item.label}</span>
        </li>
      ))}
    </ol>
  )
}
