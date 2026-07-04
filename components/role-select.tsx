"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Role = "parent" | "student" | "builder"
export function RoleSelect({
  value,
  onChange,
}: {
  value: Role
  onChange: (r: Role) => void
}) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as Role)} className="justify-center">
      <ToggleGroupItem value="parent" aria-label="Parent">
        Parent
      </ToggleGroupItem>
      <ToggleGroupItem value="student" aria-label="Student">
        Student
      </ToggleGroupItem>
      <ToggleGroupItem value="builder" aria-label="Builder">
        Builder
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
