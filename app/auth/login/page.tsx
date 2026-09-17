"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

type Role = "parent" | "student" | "builder"

const ROLES: { role: Role; emoji: string; title: string; desc: string; hoverBg: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  {
    role: "parent",
    emoji: "👪",
    title: "Parent",
    desc: "Manage & approve",
    hoverBg: "hover:bg-blue-50/60 dark:hover:bg-blue-900/20",
    activeBg: "bg-blue-50 dark:bg-blue-900/30",
    activeText: "text-blue-700 dark:text-blue-300",
    activeBorder: "border-blue-300 dark:border-blue-700",
  },
  {
    role: "student",
    emoji: "🎓",
    title: "Student",
    desc: "Submit & track",
    hoverBg: "hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20",
    activeBg: "bg-emerald-50 dark:bg-emerald-900/30",
    activeText: "text-emerald-700 dark:text-emerald-300",
    activeBorder: "border-emerald-300 dark:border-emerald-700",
  },
  {
    role: "builder",
    emoji: "🔨",
    title: "Builder",
    desc: "Build & earn",
    hoverBg: "hover:bg-orange-50/60 dark:hover:bg-orange-900/20",
    activeBg: "bg-orange-50 dark:bg-orange-900/30",
    activeText: "text-orange-700 dark:text-orange-300",
    activeBorder: "border-orange-300 dark:border-orange-700",
  },
]

export default function LoginPage() {
  const [role, setRole] = useState<Role>("parent")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const userRole = data.user?.user_metadata?.role || role
      const dest =
        userRole === "builder" ? "/builder/dashboard"
        : userRole === "student" ? "/student/dashboard"
        : "/parent/dashboard"
      router.push(dest)
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-background">
      {/* ── LEFT PANEL — brand/illustration ── */}
      <aside className="hidden lg:flex flex-col justify-between w-[45%] bg-primary relative overflow-hidden p-10">
        {/* BG decoration */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-base">BT</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">BuildTrack</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-white font-extrabold text-4xl leading-tight tracking-tight">
              Welcome back to<br />BuildTrack
            </h2>
            <p className="mt-4 text-blue-100 text-base leading-relaxed max-w-xs">
              Sign in to your account and pick up where you left off. Your projects are waiting.
            </p>
          </div>
          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Real-time project progress updates",
              "Secure parent approval workflow",
              "Verified builder network",
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-blue-200 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="relative">
          <p className="text-blue-200 text-xs">© 2026 BuildTrack — All rights reserved</p>
        </div>
      </aside>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md bt-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-bold text-lg">Build<span className="text-primary">Track</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose your role and enter your credentials</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {ROLES.map(r => (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                className={[
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-150",
                  role === r.role
                    ? `${r.activeBg} ${r.activeBorder} ${r.activeText}`
                    : `border-border bg-card ${r.hoverBg} text-muted-foreground hover:text-foreground`,
                ].join(" ")}
              >
                <span className="text-xl">{r.emoji}</span>
                <span className="text-xs font-semibold">{r.title}</span>
                <span className="text-[10px] opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>

          {/* Quick Demo Sign-in */}
          <div className="mb-5 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick 1-Click Demo Sign-in</span>
              <span className="text-primary text-[10px] font-normal">Instant Access</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('parent')
                  setEmail('parent@demo.com')
                  setPassword('demo1234')
                }}
                className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-medium text-foreground hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950 transition-colors text-center"
              >
                👪 Parent
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('student')
                  setEmail('student@demo.com')
                  setPassword('demo1234')
                }}
                className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-medium text-foreground hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950 transition-colors text-center"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('builder')
                  setEmail('builder@demo.com')
                  setPassword('demo1234')
                }}
                className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-medium text-foreground hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950 transition-colors text-center"
              >
                🔨 Builder
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm bt-btn-glow disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
