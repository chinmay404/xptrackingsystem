import { createClient } from "@/lib/supabase/server"
import { XPDashboard } from "@/components/xp-dashboard"
import { PERSONAL_USER_ID } from "@/lib/types"

const demoQuests = [
  { id: "q1", name: "Complete Workout", xp_value: 30, category: "fitness", icon: "💪", sort_order: 1 },
  { id: "q2", name: "Hit Macros (160g Protein)", xp_value: 20, category: "nutrition", icon: "🥗", sort_order: 2 },
  { id: "q3", name: "0 Minutes Porn", xp_value: 20, category: "wellness", icon: "🚫", sort_order: 3 },
  { id: "q4", name: "4 Hours Deep Coding", xp_value: 10, category: "productivity", icon: "💻", sort_order: 4 },
  { id: "q5", name: "7+ Hours Sleep", xp_value: 10, category: "wellness", icon: "😴", sort_order: 5 },
  { id: "q6", name: "Cold Shower", xp_value: 5, category: "wellness", icon: "🚿", sort_order: 6 },
  { id: "q7", name: "Grooming (Face/Beard)", xp_value: 5, category: "wellness", icon: "✨", sort_order: 7 },
  { id: "q8", name: "Fail Condition: Fapping / Skipping Gym", xp_value: -50, category: "wellness", icon: "⚠️", sort_order: 8 },
]

const demoProfile = {
  id: "demo",
  username: "Demo Player",
  email: "demo@local",
  total_xp: 0,
  level: 1,
  streak_days: 0,
  last_active_date: null,
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export default async function Home() {
  const supabaseConfigured = isSupabaseConfigured()

  // Fallback demo data when Supabase isn't configured (useful for mobile preview / local demo)
  if (!supabaseConfigured) {
    return (
      <XPDashboard
        profile={demoProfile as any}
        quests={demoQuests as any}
        completions={[]}
        userId="demo"
        yearLogs={[]}
        initialTimerSeconds={0}
      />
    )
  }

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

  // Fetch all quests with safe fallback seed if table is empty
  let { data: quests, error: questsError } = await supabase.from("quests").select("*").order("sort_order")

  if (questsError) {
    console.log("[v0] quests fetch error, falling back to demo:", questsError.message)
    return (
      <XPDashboard
        profile={demoProfile as any}
        quests={demoQuests as any}
        completions={[]}
        userId="demo"
        yearLogs={[]}
        initialTimerSeconds={0}
      />
    )
  }

  if (!quests || quests.length === 0) {
    const { data: newQuests } = await supabase.from("quests").insert(demoQuests).select().order("sort_order")
    quests = newQuests || demoQuests
  }

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
