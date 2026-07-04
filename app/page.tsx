'use client'

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [testResult, setTestResult] = useState('')
  const [isTestingPayment, setIsTestingPayment] = useState(false)

  useEffect(() => {
    fetch('/api/backend/health')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(() => {
        setApiStatus('connected')
      })
      .catch(() => {
        setApiStatus('failed')
      })
  }, [])

  const testCreatePayment = async () => {
    setIsTestingPayment(true)
    setTestResult('')
    
    try {
      const response = await fetch('http://127.0.0.1:8000/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: 1,
          amount: 100.0,
          gateway_id: 'homepage_test'
        })
      })
      
      const payment = await response.json()
      setTestResult(`✅ Payment created! ID: ${payment.id}, Status: ${payment.status}`)
    } catch (err) {
      setTestResult(`❌ Error: ${(err as Error).message}`)
    } finally {
      setIsTestingPayment(false)
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/75 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl h-16 px-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-primary hover:opacity-90 transition-opacity">
            BuildTrack
          </Link>
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/builders"
              className="px-3 py-2 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Builders
            </Link>
            <Link
              href="/reviews"
              className="px-3 py-2 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Reviews
            </Link>
            <Link
              href="/auth/login"
              className="px-3 py-2 rounded-md text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Login
            </Link>
            <Button asChild size="sm" className="hover:opacity-90 transition-opacity">
              <Link href="/auth/signup" aria-label="Sign up">
                Sign up
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="px-6 md:px-8 w-full max-w-6xl mx-auto py-14">
        <div className="text-center animate-in fade-in-50 duration-300">
          <span className="inline-block text-xs font-medium tracking-wide text-accent bg-accent/10 px-3 py-1 rounded-full">
            Build smart. Track better.
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold text-balance">
            Project tracking for Parents, Students, and Builders
          </h1>
          <p className="mt-4 text-muted-foreground text-pretty md:text-lg">
            See progress at a glance, approve work securely, and collaborate with verified builders — all in one place.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/builders">Explore Builders</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/reviews">View Reviews</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 animate-in fade-in-50 slide-in-from-left-2 duration-300">
            <h3 className="font-medium">Live Progress</h3>
            <p className="text-sm text-muted-foreground">Timelines, updates, and uploads in a clear visual stream.</p>
            <div className="relative mt-3 aspect-[14/4] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=160&width=560&query=timeline progress bars dark ui"}
                alt="Timeline preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90"
              />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 animate-in fade-in-50 duration-300">
            <h3 className="font-medium">Verified Builders</h3>
            <p className="text-sm text-muted-foreground">Browse portfolios and compare offers with ratings.</p>
            <div className="relative mt-3 aspect-[14/4] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=160&width=560&query=builder cards grid dark theme"}
                alt="Builders preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90"
              />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 animate-in fade-in-50 slide-in-from-right-2 duration-300">
            <h3 className="font-medium">Safe Approvals</h3>
            <p className="text-sm text-muted-foreground">Parents approve work and pay securely with confidence.</p>
            <div className="relative mt-3 aspect-[14/4] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=160&width=560&query=secure payment confirmation modal dark"}
                alt="Payments preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/parent/dashboard"
            className="group rounded-lg border bg-card p-5 transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg/10"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Explore as Parent</h3>
              <span className="text-xs text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Approve requests, track progress, and manage payments.</p>
            <div className="relative mt-4 aspect-[4/1] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=140&width=560&query=parent dashboard dark ui cards"}
                alt="Parent dashboard preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </Link>

          <Link
            href="/student/dashboard"
            className="group rounded-lg border bg-card p-5 transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg/10"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Explore as Student</h3>
              <span className="text-xs text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Submit requests and follow project updates.</p>
            <div className="relative mt-4 aspect-[4/1] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=140&width=560&query=student request form dark theme"}
                alt="Student dashboard preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </Link>

          <Link
            href="/builder/dashboard"
            className="group rounded-lg border bg-card p-5 transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg/10"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Explore as Builder</h3>
              <span className="text-xs text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Upload progress and keep everyone in the loop.</p>
            <div className="relative mt-4 aspect-[4/1] overflow-hidden rounded-md">
              <Image
                src={"/placeholder.svg?height=140&width=560&query=builder uploads gallery dark ui"}
                alt="Builder dashboard preview"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </Link>
        </div>

        {/* API Integration Test Section */}
        <div className="mt-12 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">🚀 Backend API Integration Test</h2>
          <p className="text-muted-foreground mb-4">Test the payment workflow with your FastAPI backend</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm">Backend Status:</span>
              <span className={`text-sm ${
                apiStatus === 'checking' ? 'text-muted-foreground' :
                apiStatus === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {apiStatus === 'checking' ? 'Checking...' :
                 apiStatus === 'connected' ? 'Connected ✓' : 'Failed ✗'}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm"
                disabled={isTestingPayment || apiStatus !== 'connected'}
                onClick={testCreatePayment}
              >
                {isTestingPayment ? 'Creating...' : 'Test Create Payment'}
              </Button>
            </div>
            
            {testResult && (
              <div className={`text-sm mt-2 ${
                testResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
