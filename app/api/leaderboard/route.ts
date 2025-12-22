import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get leaderboard: current user + accepted friends
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get friend IDs
  const { data: friendships } = await supabase
    .from("friends")
    .select("user_id, friend_id")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq("status", "accepted")

  const friendIds = new Set<string>()
  friendships?.forEach((f) => {
    if (f.user_id === user.id) friendIds.add(f.friend_id)
    else friendIds.add(f.user_id)
  })

  // Include current user
  const allIds = [user.id, ...Array.from(friendIds)]

  // Get profiles for leaderboard
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, total_xp, level, current_streak, longest_streak")
    .in("id", allIds)
    .order("total_xp", { ascending: false })

  // Get today's XP for each
  const today = new Date().toISOString().split("T")[0]
  const { data: todayLogs } = await supabase
    .from("daily_logs")
    .select("user_id, total_xp")
    .in("user_id", allIds)
    .eq("log_date", today)

  const todayMap = new Map(todayLogs?.map((l) => [l.user_id, l.total_xp]) || [])

  const leaderboard = profiles?.map((p) => ({
    ...p,
    today_xp: todayMap.get(p.id) || 0,
    is_you: p.id === user.id,
  })) || []

  return NextResponse.json({ leaderboard })
}
