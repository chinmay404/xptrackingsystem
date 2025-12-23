import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get friend IDs
  const { data: friendships } = await supabase
    .from("friends")
    .select("user_id, friend_id, status")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  const acceptedFriendIds = new Set<string>()
  const pendingRequests: { id: string; email: string }[] = []

  friendships?.forEach((f) => {
    if (f.status === "accepted") {
      if (f.user_id === user.id) acceptedFriendIds.add(f.friend_id)
      else acceptedFriendIds.add(f.user_id)
    } else if (f.status === "pending" && f.friend_id === user.id) {
      // Incoming request
      pendingRequests.push({ id: f.user_id, email: "" })
    }
  })

  const allIds = [user.id, ...Array.from(acceptedFriendIds)]

  // Get profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email, total_xp, level, current_streak, longest_streak")
    .in("id", allIds)
    .order("total_xp", { ascending: false })

  // Get today's XP
  const today = new Date().toISOString().split("T")[0]
  const { data: todayLogs } = await supabase
    .from("daily_logs")
    .select("user_id, total_xp")
    .in("user_id", allIds)
    .eq("log_date", today)

  const todayMap = new Map(todayLogs?.map((l) => [l.user_id, l.total_xp]) || [])

  // Get pending request profiles
  if (pendingRequests.length > 0) {
    const { data: pendingProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", pendingRequests.map((p) => p.id))

    pendingProfiles?.forEach((p) => {
      const req = pendingRequests.find((r) => r.id === p.id)
      if (req) req.email = p.email || "Unknown"
    })
  }

  const leaderboard = profiles?.map((p, index) => ({
    ...p,
    today_xp: todayMap.get(p.id) || 0,
    is_you: p.id === user.id,
    rank: index + 1,
  })) || []

  return (
    <div className="min-h-screen cyber-bg text-white">
      <div className="fixed inset-0 pointer-events-none scanlines z-40 opacity-30" />

      <header className="relative border-b border-cyan-900/50 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white cyber-text">LEADERBOARD</h1>
            <p className="text-cyan-500 text-xs tracking-widest">COMPETE WITH FRIENDS</p>
          </div>
          <Link href="/" className="cyber-button-secondary px-4 py-2 text-sm">
            BACK TO DASHBOARD
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Add Friend Form */}
        <div className="cyber-card p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">ADD FRIEND</h2>
          <form action="/api/friends" method="POST" className="flex gap-3">
            <input
              type="email"
              name="friend_email"
              placeholder="Friend's email address"
              required
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />
            <button type="submit" className="cyber-button px-6 py-2 text-sm">
              SEND REQUEST
            </button>
          </form>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="cyber-card-danger p-6 mb-8">
            <h2 className="text-lg font-bold text-amber-400 mb-4">PENDING REQUESTS</h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                  <span className="text-white">{req.email}</span>
                  <div className="flex gap-2">
                    <form action={`/api/friends/${req.id}`} method="POST">
                      <input type="hidden" name="_method" value="PATCH" />
                      <input type="hidden" name="status" value="accepted" />
                      <button type="submit" className="cyber-button px-4 py-1 text-xs">ACCEPT</button>
                    </form>
                    <form action={`/api/friends/${req.id}`} method="POST">
                      <input type="hidden" name="_method" value="PATCH" />
                      <input type="hidden" name="status" value="blocked" />
                      <button type="submit" className="cyber-button-danger px-4 py-1 text-xs">REJECT</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="cyber-card p-6">
          <h2 className="text-lg font-bold text-white mb-6">RANKINGS</h2>
          
          {leaderboard.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Add friends to see the leaderboard!</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    player.is_you
                      ? "bg-cyan-500/10 border border-cyan-500/30"
                      : "bg-slate-900/50 border border-slate-800"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    player.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                    player.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                    player.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                    "bg-slate-800 text-slate-500"
                  }`}>
                    {player.rank}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-bold ${player.is_you ? "text-cyan-400" : "text-white"}`}>
                      {player.username} {player.is_you && "(YOU)"}
                    </p>
                    <p className="text-slate-500 text-sm">Level {player.level} • {player.current_streak || 0} day streak</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-400">{player.total_xp}</p>
                    <p className="text-xs text-slate-500">+{player.today_xp} today</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
