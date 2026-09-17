'use client'

import Link from "next/link";
import { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap, 
  ChevronRight, 
  Lock, 
  Check, 
  Clock, 
  FileText, 
  Award, 
  Upload, 
  Sparkles, 
  DollarSign, 
  Eye, 
  MessageSquare,
  BadgeCheck,
  Building2,
  GraduationCap,
  HeartHandshake
} from "lucide-react";

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [activeTab, setActiveTab] = useState<'parent' | 'student' | 'builder'>('parent')
  const [demoApproved, setDemoApproved] = useState(false)

  useEffect(() => {
    fetch('/api/backend/health')
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('failed'))
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      {/* ── TOP ANNOUNCEMENT BANNER ── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase">
          BuildTrack v2.0
        </span>
        <span>Dual-signature escrow & live milestone verification are now active for all student capstones.</span>
        <Link href="/builders" className="underline underline-offset-2 font-semibold hover:text-blue-200 transition-colors ml-1 hidden sm:inline">
          Find a Builder &rarr;
        </Link>
      </div>

      {/* ── HEADER / NAVIGATION ── */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-base tracking-tight">BT</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">
                Build<span className="text-primary">Track</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                Verified Projects
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            <Link 
              href="#pillars" 
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/builders" 
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors flex items-center gap-1.5"
            >
              <span>Explore Builders</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                4.9★
              </span>
            </Link>
            <Link 
              href="/reviews" 
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              Reviews
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link 
              href="/auth/login" 
              className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-border/60">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-200/40 via-purple-100/30 to-transparent dark:from-blue-900/20 dark:via-purple-900/10 blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Main Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-foreground/80 mb-5 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-primary font-bold">Zero-Risk Escrow</span>
              <span className="text-muted-foreground">•</span>
              <span>Verified Builders</span>
              <span className="text-muted-foreground">•</span>
              <span>Live Milestone Audits</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
              Project tracking for{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Parents, Students
              </span>{" "}
              & Builders
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Say goodbye to unfinished projects and payment anxiety. Students submit requirements, parents approve milestones with protected escrow, and verified builders deliver proof-backed results.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3.5 flex-wrap">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-95 text-sm"
              >
                <span>Start Your Project Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/builders"
                className="flex items-center gap-2 px-5 py-3.5 bg-card border border-border text-foreground font-medium rounded-xl hover:bg-muted/60 transition-all shadow-sm text-sm"
              >
                <Users className="w-4 h-4 text-primary" />
                <span>Browse Verified Builders</span>
              </Link>
            </div>

            {/* Quick Proof Badges */}
            <div className="mt-8 flex items-center justify-center gap-6 sm:gap-8 flex-wrap text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                100% Escrow Protection
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-blue-600" />
                ID-Verified Builders Only
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Under 48h Response Guarantee
              </span>
            </div>
          </div>

          {/* ── LIVE INTERACTIVE PRODUCT SHOWCASE WIDGET ── */}
          <div className="max-w-5xl mx-auto bg-card border border-border/80 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all">
            {/* Window chrome header */}
            <div className="bg-muted/50 border-b border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:inline">
                  BuildTrack Workspace • Interactive Live Preview
                </span>
              </div>

              {/* Role Toggle Selector */}
              <div className="flex items-center bg-background/80 border border-border/80 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('parent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'parent'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Parent Control</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'student'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'builder'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Builder View</span>
                </button>
              </div>
            </div>

            {/* Dynamic Interactive Preview Body */}
            <div className="p-5 sm:p-7">
              {activeTab === 'parent' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Active Project
                        </span>
                        <span className="text-xs text-muted-foreground">ID: #BT-7842</span>
                      </div>
                      <h3 className="text-lg font-bold mt-1 text-foreground">
                        Autonomous Obstacle-Avoidance Rover (Senior Capstone)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Student: <span className="font-semibold text-foreground">Leo Martinez</span> • Builder: <span className="font-semibold text-foreground">Marcus Vance (Verified ★ 4.95)</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-xl border border-border shadow-sm">
                      <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase font-semibold">Total Escrow Vault</div>
                        <div className="text-lg font-black text-emerald-600">$450.00 <span className="text-xs font-normal text-muted-foreground">(Protected)</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Progression Stepper */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">Milestone Roadmap (3 of 4 in progress)</span>
                      <span className="text-primary font-bold">75% Complete</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-primary rounded-full transition-all duration-500 w-3/4" />
                    </div>

                    {/* Milestones List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl border border-emerald-300/80 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>1. BOM & Sourcing</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-muted-foreground text-[11px]">Chassis & motors procured.</p>
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">$120 Paid</div>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-300/80 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>2. Circuit Assembly</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-muted-foreground text-[11px]">Soldered PCB & battery test.</p>
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">$150 Paid</div>
                      </div>

                      <div className="p-3 rounded-xl border-2 border-primary bg-primary/5 text-xs space-y-1 shadow-sm relative ring-2 ring-primary/20">
                        <div className="flex items-center justify-between font-bold text-primary">
                          <span>3. LiDAR & Firmware</span>
                          <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                        </div>
                        <p className="text-foreground text-[11px] font-medium">Proof uploaded & ready for review.</p>
                        <div className="text-primary font-bold">$180 Awaiting Sign-off</div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-card/60 text-xs space-y-1 opacity-70">
                        <div className="flex items-center justify-between font-medium text-muted-foreground">
                          <span>4. Final Test & Code</span>
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-muted-foreground text-[11px]">Video demo & repository transfer.</p>
                        <div className="text-muted-foreground font-medium">$100 Remaining</div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Milestone Action Card */}
                  <div className="bg-card border-2 border-primary/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertBadgeIcon className="w-3 h-3" />
                          Parent Action Required
                        </span>
                        <span className="text-xs text-muted-foreground">Milestone 3 Proof Ready</span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm">
                        Marcus Vance uploaded 3 test photos & autonomous avoidance video (1080p).
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Student Leo has inspected the test output and signed off. As parent, your release authorization transfers $180 from escrow.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                      {demoApproved ? (
                        <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>$180 Escrow Released! ✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDemoApproved(true)}
                          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 active:scale-95 w-full sm:w-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Release $180</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'student' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        Student Workspace
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        Submit Requests & Track Builder Milestones In Real Time
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose verified builders from the catalog or broadcast project briefs to top-ranked university builders.
                      </p>
                    </div>
                    <Link
                      href="/student/dashboard"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Live Builder Chat Simulation */}
                    <div className="border border-border rounded-xl p-4 bg-background space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            MV
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">Marcus Vance (Builder)</div>
                            <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active in workspace
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Today, 4:12 PM</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="bg-muted/60 p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-foreground">
                          Hey Leo! I just completed the sensor calibration script. All 4 sonar beams are reading within 2mm precision.
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl rounded-tr-none max-w-[85%] ml-auto text-foreground">
                          Awesome! Does the obstacle avoidance loop maintain 30 FPS on the ESP32?
                        </div>
                        <div className="bg-muted/60 p-2.5 rounded-xl rounded-tl-none max-w-[85%] text-foreground">
                          Yes! Consistently at 38 FPS with dual-core task affinity. Just pushed the demo video to the milestone upload tray.
                        </div>
                      </div>
                    </div>

                    {/* Milestone Review Checklist */}
                    <div className="border border-border rounded-xl p-4 bg-background space-y-3">
                      <div className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Milestone 3 Deliverables Checklist</span>
                        <span className="text-emerald-600 font-semibold">3 of 3 Verified</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-foreground">Source code: /firmware/sonar_loop.ino (Tested)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-foreground">Wiring schematic & pinout PDF (v2.1)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-foreground">Live run video: obstacle_course_demo.mp4</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">Ready for Parent Approval</span>
                        <span className="font-bold text-primary">Status: In Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'builder' && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40">
                    <div>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        Builder Command Center
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        Guaranteed Escrow Payouts & Verified Reputation Growth
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        No chasing client invoices. Funds are deposited into BuildTrack escrow before you start building.
                      </p>
                    </div>
                    <Link
                      href="/builder/dashboard"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shrink-0"
                    >
                      <span>Builder Dashboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground font-medium">Secured in Escrow</div>
                      <div className="text-2xl font-black text-foreground mt-1">$2,450.00</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">3 Active Contracts</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground font-medium">Builder Rating</div>
                      <div className="text-2xl font-black text-amber-500 mt-1">4.98 ★</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">From 48 Family Reviews</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground font-medium">Dispute Rate</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">0.0%</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">100% On-time Release</div>
                    </div>
                  </div>

                  {/* Upload Proof Dropzone Mockup */}
                  <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-foreground">Upload Milestone Proof Files</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Drag and drop circuit photos, test run MP4s, or GitHub repo links. Both parent and student receive instant notification.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE 3 CORE PILLARS SECTION ── */}
      <section id="pillars" className="py-20 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            Uncompromising Quality
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 text-foreground">
            Everything designed for transparency & trust
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            No empty promises or broken communication. BuildTrack replaces anxiety with verifiable proof at every step.
          </p>
        </div>

        {/* 3 Rich Cards replacing the empty placeholder boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Live Progress Stream */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Live Progress Stream</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Timelines, photos, video proof, and milestone sign-offs in a clear visual audit trail.
              </p>
            </div>

            {/* Rich Interactive Visual Widget replacing empty space */}
            <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Robotics Capstone Sprint</span>
                <span className="text-blue-600 font-bold">Step 3 of 4 (75%)</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-blue-600 rounded-full" />
              </div>

              {/* Real Milestone Snippet */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-foreground">PCB SMT Assembly</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Approved</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span className="font-semibold text-blue-800 dark:text-blue-300">Firmware Flash & Test</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">Proof Uploaded</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  Last upload 14 mins ago
                </span>
                <span className="text-primary font-semibold">1080p Video Attached</span>
              </div>
            </div>
          </div>

          {/* Card 2: Verified Builders Directory */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Verified Builders Only</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Every builder undergoes strict identity verification, portfolio review, and skill benchmarking.
              </p>
            </div>

            {/* Rich Interactive Visual Widget replacing empty space */}
            <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border/60">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  AR
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground truncate">Alex Rivera</h4>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      4.95
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">IoT & Embedded Hardware Pro</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                      ID Verified ✓
                    </span>
                    <span className="text-[10px] text-muted-foreground">42 Projects Done</span>
                  </div>
                </div>
              </div>

              {/* Skills and SLA tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-medium bg-card border border-border px-2 py-0.5 rounded-md text-foreground">
                  Arduino / ESP32
                </span>
                <span className="text-[10px] font-medium bg-card border border-border px-2 py-0.5 rounded-md text-foreground">
                  3D CAD Print
                </span>
                <span className="text-[10px] font-medium bg-card border border-border px-2 py-0.5 rounded-md text-foreground">
                  Python ML
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available Now
                </span>
                <Link href="/builders" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  <span>View Profile</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Safe Approvals & Dual-Signature Escrow */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Safe Approvals & Escrow</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Parents approve work and pay securely with confidence. Zero upfront risk, 100% satisfaction.
              </p>
            </div>

            {/* Rich Interactive Visual Widget replacing empty space */}
            <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
              <div className="p-3 bg-card rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">Protected Escrow Balance</div>
                  <div className="text-xl font-black text-purple-700 dark:text-purple-400">$350.00 USD</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              {/* Dual-Signature Tracker */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                  <span className="text-muted-foreground">1. Student Inspection</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Signed Off
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60">
                  <span className="text-muted-foreground">2. Parent Biometric Sign</span>
                  <span className="text-primary font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Authorized
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Funds held in bank vault</span>
                <span className="font-semibold text-emerald-600">0% Dispute Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE 3 ROLE EXPLORATION HUBS ── */}
      <section className="py-16 bg-muted/30 border-y border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Built specifically for every stakeholder
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A tailored workspace designed around the exact needs of parents, students, and builders.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Explore as Parent */}
            <Link
              href="/parent/dashboard"
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-2xl">
                    👪
                  </div>
                  <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open Parent Hub &rarr;
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">Explore as Parent</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Approve requests, inspect proof photos, track budgets, and manage milestone payments.
                </p>
              </div>

              {/* Rich Visual Mini-Dashboard Preview */}
              <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Sarah's Biotech Project</span>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    1 Approval Pending
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: $420</span>
                  <span>Budget: $600</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-blue-600 rounded-full" />
                </div>
                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Escrow: Bank Protected</span>
                  <span className="text-primary font-semibold">View Statement &rarr;</span>
                </div>
              </div>
            </Link>

            {/* Explore as Student */}
            <Link
              href="/student/dashboard"
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open Student Studio &rarr;
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">Explore as Student</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit capstone specifications, compare verified builders, and follow project updates.
                </p>
              </div>

              {/* Rich Visual Mini-Dashboard Preview */}
              <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Drone Auto-Landing System</span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    3 Builder Quotes
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs p-2 bg-card rounded-lg border border-border/60">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate text-foreground text-[11px]">project_spec_v3_final.pdf</span>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Target Due: In 14 Days</span>
                  <span className="text-emerald-600 font-semibold">Ready to Build &rarr;</span>
                </div>
              </div>
            </Link>

            {/* Explore as Builder */}
            <Link
              href="/builder/dashboard"
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-2xl">
                    🔨
                  </div>
                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open Builder Bench &rarr;
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">Explore as Builder</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload progress milestones, verify results, build stellar reviews, and get paid guaranteed escrow.
                </p>
              </div>

              {/* Rich Visual Mini-Dashboard Preview */}
              <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Active Payout Pipeline</span>
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    $1,850 Held Safe
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-card rounded-lg border border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-bold text-foreground text-[11px]">4.98 Rating</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Top 3% Builder</span>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Fast Bank Payouts</span>
                  <span className="text-amber-600 font-semibold">View Workbench &rarr;</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3 SIMPLE STEPS) ── */}
      <section id="how-it-works" className="py-20 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 text-foreground">
            How BuildTrack protects your project
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            From initial concept to verified delivery in three seamless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting gradient bar for desktop */}
          <div className="hidden md:block absolute top-14 left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-blue-400 via-primary to-emerald-400 z-0" />

          {/* Step 1 */}
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-primary/25">
              01
            </div>
            <h3 className="text-lg font-bold text-foreground">Student Submits Spec</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Post project requirements, files, and deadlines. Browse vetted builder portfolios or receive competitive quotes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-indigo-600/25">
              02
            </div>
            <h3 className="text-lg font-bold text-foreground">Parent Funds Escrow</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Parent reviews the milestones and deposits funds into a protected escrow vault. No builder is paid until work is approved.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-emerald-600/25">
              03
            </div>
            <h3 className="text-lg font-bold text-foreground">Inspect Proof & Release</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Builder uploads photos, demo videos, and code. Parents and students inspect the proof, and release payments milestone by milestone.
            </p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF & STATS STRIP ── */}
      <section className="border-y border-border/80 bg-card/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-primary">850+</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">Capstones & Builds Completed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600">100%</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">Escrow Payout Protection</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-500">4.95 ★</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">Average Family Rating</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">&lt; 2h</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">Average Response SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            Real Stories
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-foreground">
            Trusted by students, verified by parents
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &ldquo;As a parent, I was terrified of transferring hundreds of dollars to unknown online freelancers for my son's mechatronics capstone. BuildTrack's escrow gave us 100% safety. We only released money when we saw the tested rover working on video.&rdquo;
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                PM
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Priya Menon</div>
                <div className="text-[10px] text-muted-foreground">Parent of Engineering Senior</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &ldquo;I matched with a verified PCB specialist within two hours. The milestone chat and upload tray made collaborating effortless. Submitted my project two days ahead of deadline and got top honors!&rdquo;
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                SK
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Siddharth Kumar</div>
                <div className="text-[10px] text-muted-foreground">Robotics Major, IIT Dept.</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &ldquo;Zero payment disputes. Ever. Knowing the parent's payment is already safely locked in BuildTrack escrow lets me focus on building high-grade hardware without stressing over invoices.&rdquo;
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                MV
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Marcus Vance</div>
                <div className="text-[10px] text-muted-foreground">Verified Hardware Builder (48 Builds)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGH-CONVERTING BOTTOM CTA BANNER ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="relative bg-gradient-to-tr from-primary via-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl text-white">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative max-w-2xl mx-auto">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Start in 2 minutes
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">
              Ready to build without the anxiety?
            </h2>
            <p className="mt-4 text-blue-100 text-sm sm:text-base leading-relaxed">
              Join hundreds of families, students, and verified builders collaborating safely on BuildTrack today.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3.5 flex-wrap">
              <Link
                href="/auth/signup"
                className="px-6 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm active:scale-95"
              >
                Create Free Account &rarr;
              </Link>
              <Link
                href="/builders"
                className="px-6 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm"
              >
                Browse Builders
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-blue-200">
              <span>✓ No credit card required</span>
              <span>✓ Free student project posting</span>
              <span>✓ Instant parent access</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/80 bg-card/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xs">
                BT
              </div>
              <span className="font-bold text-base tracking-tight">BuildTrack</span>
              <span className="text-muted-foreground text-xs font-normal">
                — Transparent project tracking for families
              </span>
            </div>

            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <Link href="/builders" className="hover:text-foreground transition-colors">Builders</Link>
              <Link href="/reviews" className="hover:text-foreground transition-colors">Reviews</Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="/auth/signup" className="hover:text-foreground transition-colors">Sign up</Link>

              {/* API Status Badge */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-emerald-500' :
                  apiStatus === 'failed' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                <span className="text-[11px] font-medium">
                  {apiStatus === 'connected' ? 'API Live' : apiStatus === 'failed' ? 'API Offline' : 'Checking API...'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} BuildTrack. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Security & Escrow</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AlertBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
