import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

/**
 * GET /api/stats
 * Retrieves comprehensive statistics and analytics
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

    // Get all daily logs
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("log_date", { ascending: false })

    // Get quest completions with quest details
    const { data: completions } = await supabase
      .from("quest_completions")
      .select("*, quests(*)")
      .eq("user_id", PERSONAL_USER_ID)

    // Get all quests
    const { data: quests } = await supabase.from("quests").select("*")

    const logsArray = logs || []
    const completionsArray = completions || []
    const questsArray = quests || []

    // Calculate stats
    const totalDays = logsArray.length
    const totalXP = profile?.total_xp || 0
    const averageXP = totalDays > 0 ? Math.round(totalXP / totalDays) : 0
    const bestDay = logsArray.reduce((max, log) => (log.total_xp > (max?.total_xp || 0) ? log : max), logsArray[0])
    const goalsAchieved = logsArray.filter((log) => log.total_xp >= 70).length
    const completionRate = totalDays > 0 ? Math.round((goalsAchieved / totalDays) * 100) : 0

    // Category breakdown
    const categoryStats = completionsArray.reduce(
      (acc, completion: any) => {
        const category = completion.quests?.category || "Other"
        if (!acc[category]) {
          acc[category] = { count: 0, xp: 0 }
        }
        acc[category].count++
        acc[category].xp += completion.xp_earned
        return acc
      },
      {} as Record<string, { count: number; xp: number }>,
    )

    // Quest frequency
    const questFrequency = completionsArray.reduce(
      (acc, completion: any) => {
        const questName = completion.quests?.name || "Unknown"
        acc[questName] = (acc[questName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Weekly stats
    const today = new Date()
    const last7Days = logsArray
      .filter((log) => {
        const logDate = new Date(log.log_date)
        const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays < 7
      })
      .reduce((sum, log) => sum + log.total_xp, 0)

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          total_xp: totalXP,
          level: profile?.level || 1,
          streak_days: profile?.streak_days || 0,
        },
        overview: {
          total_days_tracked: totalDays,
          average_xp_per_day: averageXP,
          goals_achieved: goalsAchieved,
          completion_rate: completionRate,
          best_day: bestDay,
          last_7_days_xp: last7Days,
        },
        categories: categoryStats,
        quest_frequency: questFrequency,
        total_quests: questsArray.length,
        total_completions: completionsArray.length,
      },
      meta: {
        endpoint: "/api/stats",
        method: "GET",
        generated_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
