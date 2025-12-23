import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Global leaderboard (top 50 by total XP)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch all profiles by total XP (everyone, even 0 XP)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, total_xp, level, current_streak, longest_streak")
    .order("total_xp", { ascending: false })

  const ids = profiles?.map((p) => p.id) || []

  // Today's XP for displayed users
  const today = new Date().toISOString().split("T")[0]
  const { data: todayLogs } = await supabase
    .from("daily_logs")
    .select("user_id, total_xp")
    .in("user_id", ids)
    .eq("log_date", today)

  const todayMap = new Map(todayLogs?.map((l) => [l.user_id, l.total_xp]) || [])

  const leaderboard = (profiles || []).map((p) => ({
    ...p,
    today_xp: todayMap.get(p.id) || 0,
    is_you: p.id === user.id,
  }))

  return NextResponse.json({ leaderboard })
}
