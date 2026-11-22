import Link from "next/link";
import { FileText, Database, ShieldCheck, Printer, ArrowRight, Activity, Stethoscope } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">HOSPITAL INPATIENT EMR</h1>
            <p className="text-xs text-sky-300/80">Neonatal & Pediatric Intensive Care Information System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Oracle DB Connected (192.168.0.246:1521/ORCL)</span>
          </div>

          <Link
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-medium mb-6">
            <Stethoscope className="w-3.5 h-3.5" /> Next.js 14 App Router • TypeScript • Tailwind CSS • Oracle thin pool
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Inpatient & NICU <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300">
              Discharge Summary (NICU) Module
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
            A beginner-friendly, production-ready Electronic Medical Record (EMR) interface. 
            Safely queries and writes to Oracle Database using parameterized bind variables, 
            features structured medication planning, and generates clean, print-friendly clinical discharge summaries.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/discharge"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-all shadow-lg shadow-sky-500/25 group"
            >
              <span>Launch Discharge Summary (NICU)</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium transition-all"
            >
              <span>Sign In (admin / admin)</span>
            </Link>

            <a
              href="/api/discharge?action=health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-all"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>DB Health</span>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-2">Oracle Connection Pool</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Configured via <code className="text-sky-300 text-xs font-mono">src/lib/oracle.ts</code> using pure JavaScript Thin mode with reusable connection pooling and automatic resource recycling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-2">Safe Parameterized Queries</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              API routes at <code className="text-emerald-300 text-xs font-mono">src/app/api/discharge</code> prevent SQL injection attacks through Oracle bind variables and atomic MERGE statements.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-2">Print-Friendly Format</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              One-click print preview designed specifically for hospital paper records, prescription formatting, doctor signatures, and patient handover instructions.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-400">
        Inpatient EMR Discharge Summary (NICU) • Built with Next.js App Router &amp; Oracle 12c DB
      </footer>
    </div>
  );
}
