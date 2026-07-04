"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <CardHeader>
          <CardTitle className="text-center">Sign in to BuildTrack</CardTitle>
          <CardDescription className="text-center">
            Choose your account type to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link href="/auth/parent">
            <Button variant="outline" className="w-full h-16 text-left flex items-center gap-3 hover:bg-blue-50">
              <div className="text-2xl">👪</div>
              <div>
                <div className="font-semibold">Parent</div>
                <div className="text-sm text-muted-foreground">Manage payments and track progress</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/auth/student">
            <Button variant="outline" className="w-full h-16 text-left flex items-center gap-3 hover:bg-green-50">
              <div className="text-2xl">🎓</div>
              <div>
                <div className="font-semibold">Student</div>
                <div className="text-sm text-muted-foreground">Submit requests and collaborate</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/auth/builder">
            <Button variant="outline" className="w-full h-16 text-left flex items-center gap-3 hover:bg-orange-50">
              <div className="text-2xl">🔨</div>
              <div>
                <div className="font-semibold">Builder</div>
                <div className="text-sm text-muted-foreground">Upload progress and manage projects</div>
              </div>
            </Button>
          </Link>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            No account?{" "}
            <Link className="underline hover:text-foreground" href="/auth/signup">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
