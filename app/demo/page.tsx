import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Build Track App Demo</h1>
            <p className="text-xl text-muted-foreground">
              Role-Based Authentication System
            </p>
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✅ Supabase Environment Configured
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👨‍👩‍👧‍👦 Parent Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Access parent dashboard, hire builders, manage projects and payments.
                </p>
                <Link href="/auth/parent">
                  <Button className="w-full">
                    Login as Parent
                  </Button>
                </Link>
                <div className="text-xs space-y-1">
                  <div>• Project management</div>
                  <div>• Payment processing</div>
                  <div>• Builder directory</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎓 Student Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Submit help requests, upload materials, track progress.
                </p>
                <Link href="/auth/student">
                  <Button className="w-full" variant="outline">
                    Login as Student
                  </Button>
                </Link>
                <div className="text-xs space-y-1">
                  <div>• Help requests</div>
                  <div>• Material uploads</div>
                  <div>• Progress tracking</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔨 Builder Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage projects, upload progress, communicate with clients.
                </p>
                <Link href="/auth/builder">
                  <Button className="w-full" variant="secondary">
                    Login as Builder
                  </Button>
                </Link>
                <div className="text-xs space-y-1">
                  <div>• Project management</div>
                  <div>• Progress uploads</div>
                  <div>• Client communication</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🔐 Security Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Role Protection</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Each role has isolated dashboards</li>
                    <li>• Automatic redirection for unauthorized access</li>
                    <li>• JWT tokens with role information</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Development Setup</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Mock authentication for development</li>
                    <li>• Easy Supabase integration</li>
                    <li>• Environment variable fallbacks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Test the System</h3>
            <p className="text-sm text-muted-foreground">
              Try accessing different dashboards and see how the role-based protection works
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/parent/dashboard">
                <Button variant="outline" size="sm">Parent Dashboard</Button>
              </Link>
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm">Student Dashboard</Button>
              </Link>
              <Link href="/builder/dashboard">
                <Button variant="outline" size="sm">Builder Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
