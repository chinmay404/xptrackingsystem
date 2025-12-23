import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const { data: customQuests } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")

  return (
    <div className="min-h-screen cyber-bg text-white">
      <div className="fixed inset-0 pointer-events-none scanlines z-40 opacity-30" />

      <header className="relative border-b border-cyan-900/50 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white cyber-text">SETTINGS</h1>
            <p className="text-cyan-500 text-xs tracking-widest">CUSTOMIZE YOUR SYSTEM</p>
          </div>
          <Link href="/" className="cyber-button-secondary px-4 py-2 text-sm">
            BACK TO DASHBOARD
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Profile Settings */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">PROFILE</h2>
          <form action="/api/me" method="PATCH" className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">USERNAME</label>
              <input
                type="text"
                name="username"
                defaultValue={profile?.username || ""}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button type="submit" className="cyber-button px-6 py-2 text-sm">
              UPDATE PROFILE
            </button>
          </form>
        </div>

        {/* Fuel Plan Settings */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">FUEL PLAN TARGETS</h2>
          <form action="/api/me" method="PATCH" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">CALORIES</label>
              <input
                type="number"
                name="target_calories"
                defaultValue={profile?.target_calories || 2750}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">PROTEIN (g)</label>
              <input
                type="number"
                name="target_protein"
                defaultValue={profile?.target_protein || 160}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">HYDRATION (L)</label>
              <input
                type="number"
                step="0.1"
                name="target_hydration"
                defaultValue={profile?.target_hydration || 3.5}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs tracking-widest block mb-2">DEEP WORK (hr)</label>
              <input
                type="number"
                name="target_deep_work"
                defaultValue={profile?.target_deep_work || 4}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <button type="submit" className="cyber-button px-6 py-2 text-sm">
                SAVE FUEL PLAN
              </button>
            </div>
          </form>
        </div>

        {/* Custom Quests */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">CUSTOM QUESTS</h2>
          <p className="text-slate-500 text-sm mb-4">Add your own quests with custom XP values. Negative XP = penalty quest.</p>

          {/* Add new quest form */}
          <form action="/api/user-quests" method="POST" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Quest name"
              required
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="number"
              name="xp_value"
              placeholder="XP value"
              required
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <button type="submit" className="cyber-button px-4 py-2 text-sm">
              ADD QUEST
            </button>
          </form>

          {/* List of custom quests */}
          {customQuests && customQuests.length > 0 ? (
            <div className="space-y-2">
              {customQuests.map((quest) => (
                <div key={quest.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                  <div>
                    <span className="text-white font-bold">{quest.name}</span>
                    <span className={`ml-3 text-sm ${quest.xp_value < 0 ? "text-red-400" : "text-cyan-400"}`}>
                      {quest.xp_value > 0 ? "+" : ""}{quest.xp_value} XP
                    </span>
                  </div>
                  <form action={`/api/user-quests/${quest.id}`} method="DELETE">
                    <button type="submit" className="text-red-400 hover:text-red-300 text-sm">
                      DELETE
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-4">No custom quests yet. Add one above!</p>
          )}
        </div>
      </main>
    </div>
  )
}
