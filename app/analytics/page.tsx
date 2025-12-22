import { createClient } from "@/lib/supabase/server"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

  // Fetch all daily logs (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: dailyLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .gte("log_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("log_date", { ascending: true })

  // Fetch all quest completions (last 30 days)
  const { data: questCompletions } = await supabase
    .from("quest_completions")
    .select(`
      *,
      quests (
        name,
        category,
        xp_value
      )
    `)
    .eq("user_id", PERSONAL_USER_ID)
    .gte("completion_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("completed_at", { ascending: false })

  // Fetch all quests for stats
  const { data: quests } = await supabase.from("quests").select("*").order("sort_order")

  return (
    <AnalyticsDashboard
      profile={profile}
      dailyLogs={dailyLogs || []}
      questCompletions={questCompletions || []}
      quests={quests || []}
    />
  )
}
