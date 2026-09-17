"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Check } from "lucide-react"

type Role = "parent" | "student" | "builder"

const ROLES: { role: Role; emoji: string; title: string; subtitle: string; desc: string; gradient: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  {
    role: "parent",
    emoji: "👪",
    title: "Parent",
    subtitle: "Oversight & Control",
    desc: "Approve requests, track progress, and manage payments for your children's projects.",
    gradient: "from-blue-500 to-blue-700",
    activeBg: "bg-blue-50 dark:bg-blue-900/30",
    activeText: "text-blue-700 dark:text-blue-300",
    activeBorder: "border-blue-400 dark:border-blue-600",
  },
  {
    role: "student",
    emoji: "🎓",
    title: "Student",
    subtitle: "Request & Track",
    desc: "Submit project requests and follow every step of the build process.",
    gradient: "from-emerald-500 to-emerald-700",
    activeBg: "bg-emerald-50 dark:bg-emerald-900/30",
    activeText: "text-emerald-700 dark:text-emerald-300",
    activeBorder: "border-emerald-400 dark:border-emerald-600",
  },
  {
    role: "builder",
    emoji: "🔨",
    title: "Builder",
    subtitle: "Build & Earn",
    desc: "Accept projects, upload progress, and grow your reputation with verified reviews.",
    gradient: "from-orange-500 to-orange-700",
    activeBg: "bg-orange-50 dark:bg-orange-900/30",
    activeText: "text-orange-700 dark:text-orange-300",
    activeBorder: "border-orange-400 dark:border-orange-600",
  },
]

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const color = score === 0 ? "bg-muted" : score === 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : "bg-emerald-500"
  const label = score === 0 ? "" : score === 1 ? "Weak" : score === 2 ? "Fair" : "Strong"

  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? color : "bg-muted"}`} />
        ))}
        {label && <span className="text-xs text-muted-foreground ml-2 leading-none self-center">{label}</span>}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] ${c.pass ? "text-emerald-600" : "text-muted-foreground"}`}>
            <Check className="w-3 h-3" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>("parent")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters required.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, name },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })
      if (error) throw error

      if (data?.user) {
        try {
          await apiFetch("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, name, role, supabase_user_id: data.user.id })
          })
        } catch (syncError) {
          console.error("Failed to sync user with backend:", syncError)
        }
      }

      if (data?.user) {
        toast({ title: "Account created!", description: `Welcome to BuildTrack as a ${role}.` })
        const dest = role === "builder" ? "/builder/dashboard" : role === "student" ? "/student/dashboard" : "/parent/dashboard"
        window.location.assign(dest)
        return
      }

      toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." })
      router.replace(`/auth/login?email=${encodeURIComponent(email)}`)
    } catch (e: any) {
      toast({ title: "Sign-up failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.role === role)!

  return (
    <main className="min-h-screen flex bg-background">
      {/* ── LEFT PANEL ── */}
      <aside className="hidden lg:flex flex-col justify-between w-[45%] bg-primary relative overflow-hidden p-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-base">BT</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">BuildTrack</span>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-white font-extrabold text-4xl leading-tight tracking-tight">
              Join BuildTrack<br />for free
            </h2>
            <p className="mt-4 text-blue-100 text-base leading-relaxed max-w-xs">
              Create your account and start collaborating on projects with verified builders and secure approvals.
            </p>
          </div>
          <ul className="space-y-3">
            {["Free account creation", "Role-tailored dashboard", "Instant notifications", "Secure payment escrow"].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-blue-200 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-blue-200 text-xs">© 2026 BuildTrack — All rights reserved</p>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md bt-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-bold text-lg">Build<span className="text-primary">Track</span></span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 2 && <div className={`h-0.5 w-10 rounded-full transition-all ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">Step {step} of 2</span>
          </div>

          {/* Step 1: Choose Role */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Choose your role</h1>
                <p className="mt-1 text-sm text-muted-foreground">Select how you'll be using BuildTrack</p>
              </div>

              <div className="space-y-3 mb-8">
                {ROLES.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setRole(r.role)}
                    className={[
                      "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                      role === r.role
                        ? `${r.activeBg} ${r.activeBorder} ${r.activeText}`
                        : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{r.title}</span>
                        <span className="text-[10px] font-medium opacity-70">{r.subtitle}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    {role === r.role && (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full ${r.activeBorder.replace("border-", "bg-")} flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm bt-btn-glow text-sm"
              >
                Continue as {selectedRole.title}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Fill Details */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to role selection
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Signing up as <span className="font-medium text-foreground">{selectedRole.emoji} {selectedRole.title}</span>
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">Full name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

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
                  <PasswordStrength password={password} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm bt-btn-glow disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                  ) : (
                    <>Create account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
