"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Database,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to destination or discharge dashboard
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect") || "/discharge";
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err: any) {
      setError(`Network error: ${err.message || "Failed to reach server"}`);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setUsername("admin");
    setPassword("admin");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 p-8 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 mb-3 shadow-inner">
            <Activity className="w-7 h-7 text-sky-200" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">INPATIENT EMR SYSTEM</h1>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            Clinical Discharge Summary (NICU) Portal
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-[11px] text-sky-200 border border-white/10">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Oracle 12c Authentication</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. admin)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to EMR"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-click Admin Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-200 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block group-hover:text-sky-700">
                    Use First User (Admin)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    User: <code className="font-mono text-sky-800 font-bold">admin</code> • Pass: <code className="font-mono text-sky-800 font-bold">admin</code>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-sky-600 bg-sky-100/80 px-2 py-1 rounded-md">
                Click to fill
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-3 bg-slate-50/80 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Metropolitan Hospital NICU / PICU EMR Module
        </div>
      </div>
    </div>
  );
}
