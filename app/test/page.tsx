'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold">API Testing</h1>
        <p className="text-muted-foreground">
          The API integration test is now available on the homepage for easier access.
        </p>
        <Link href="/">
          <Button>
            Go to Homepage API Test
          </Button>
        </Link>
      </div>
    </main>
  )
}
