import { createClient } from "@/lib/supabase/server"
import { XPDashboard } from "@/components/xp-dashboard"
import { PERSONAL_USER_ID } from "@/lib/types"

export default async function Home() {
  const supabase = await createClient()

  // Fetch profile
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).maybeSingle()

  if (!profile) {
    // Create default profile if it doesn't exist
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: PERSONAL_USER_ID,
        username: "Player One",
        email: "your@email.com",
        total_xp: 0,
        level: 1,
        streak_days: 0,
      })
      .select()
      .maybeSingle()

    if (error) {
      console.log("[v0] Profile creation error:", error.message)
    }
    profile = newProfile
  }

  // Fetch all quests
  const { data: quests } = await supabase.from("quests").select("*").order("sort_order")

  // Fetch today's completions
  const today = new Date().toISOString().split("T")[0]
  const { data: completions } = await supabase
    .from("quest_completions")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("completion_date", today)

  // Fetch all daily logs for current year
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  const { data: yearLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .gte("log_date", yearStart)

  // Fetch today's timer sessions
  const { data: timerSessions } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("session_date", today)

  const totalTimerSeconds = timerSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0

  return (
    <XPDashboard
      profile={profile}
      quests={quests || []}
      completions={completions || []}
      userId={PERSONAL_USER_ID}
      yearLogs={yearLogs || []}
      initialTimerSeconds={totalTimerSeconds}
    />
  )
}
