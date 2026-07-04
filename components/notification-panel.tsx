"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Note = { text: string; time: string }

export function NotificationPanel() {
  const [notes, setNotes] = useState<Note[]>([{ text: "Welcome to BuildTrack!", time: "just now" }])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const channel = supabase
      .channel("buildtrack:notifications")
      .on("broadcast", { event: "new-notification" }, (payload) => {
        const text = (payload?.payload as any)?.text || "New update"
        setNotes((n) => [{ text, time: "now" }, ...n])
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function simulateIncoming() {
    const supabase = getSupabaseBrowser()
    const channel = supabase.channel("buildtrack:notifications")
    await channel.send({
      type: "broadcast",
      event: "new-notification",
      payload: { text: "Builder marked a milestone." },
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Notifications</CardTitle>
        <Button size="sm" variant="outline" onClick={simulateIncoming}>
          Simulate
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {notes.map((n, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{n.text}</span>
            <span className="text-muted-foreground">{n.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
