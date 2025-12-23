import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen cyber-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="cyber-card p-8">
          <h1 className="text-3xl font-black text-center text-white cyber-text mb-2">THE XP SYSTEM</h1>
          <p className="text-cyan-500 text-center text-sm tracking-widest mb-8">GAMIFY YOUR DAY</p>

          {params.error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">{params.error}</p>
            </div>
          )}

          {params.message && (
            <div className="bg-cyan-500/20 border border-cyan-500 rounded-lg p-3 mb-4">
              <p className="text-cyan-400 text-sm text-center">{params.message}</p>
            </div>
          )}

          <form action="/auth/login" method="POST" className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">NAME (optional)</label>
              <input
                type="text"
                name="name"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">EMAIL</label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">PASSWORD</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                name="action"
                value="login"
                className="w-full cyber-button py-3 text-sm tracking-widest"
              >
                LOGIN
              </button>
              <button
                type="submit"
                name="action"
                value="signup"
                className="w-full cyber-button-secondary py-3 text-sm tracking-widest"
              >
                CREATE ACCOUNT
              </button>
            </div>
          </form>

          <p className="text-slate-600 text-xs text-center mt-6">
            Simple email + password for you and your friend
          </p>
        </div>
      </div>
    </div>
  )
}
