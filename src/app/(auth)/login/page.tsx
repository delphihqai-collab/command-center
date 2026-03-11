"use client";

import { useState } from "react";
import { login } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, AlertCircle, Activity, Zap, Shield } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-zinc-950 p-12">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top wordmark */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <Bot className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            Command Center
          </span>
        </div>

        {/* Center copy */}
        <div className="relative space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-widest text-indigo-400 uppercase">
              Hermes Fleet
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 leading-tight">
              Orchestration<br />at scale.
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
            Real-time visibility and full control over the Hermes commercial agent fleet — tasks, sessions, memory, and cron.
          </p>

          {/* Status pills */}
          <div className="flex flex-col gap-2 pt-2">
            {[
              { icon: Activity, label: "8 agents active", color: "text-emerald-400", dot: "bg-emerald-500" },
              { icon: Zap, label: "Gateway connected", color: "text-indigo-400", dot: "bg-indigo-500" },
              { icon: Shield, label: "Secure private access", color: "text-zinc-400", dot: "bg-zinc-500" },
            ].map(({ icon: Icon, label, color, dot }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`relative flex h-2 w-2`}>
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-50`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
                </span>
                <span className={`text-xs ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="relative text-xs text-zinc-700">
          Delphi Operations · Private instance
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-zinc-900 px-8 py-16">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <Bot className="h-6 w-6 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            Command Center
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-50">Welcome back</h2>
            <p className="text-sm text-zinc-500">Sign in to your operations console</p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="border-zinc-700 bg-zinc-800/80 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 h-11"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                className="border-zinc-700 bg-zinc-800/80 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 h-11"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-700">
            Private system · Unauthorised access prohibited
          </p>
        </div>
      </div>
    </div>
  );
}
