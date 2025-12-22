import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PERSONAL_USER_ID } from "@/lib/types"

// Weekly summary email
export async function POST() {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Get last 7 days of logs
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split("T")[0]

  const { data: weekLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .gte("log_date", weekAgoStr)
    .order("log_date", { ascending: false })

  const totalWeekXP = weekLogs?.reduce((sum, log) => sum + log.total_xp, 0) || 0
  const daysLogged = weekLogs?.length || 0
  const daysGoalMet = weekLogs?.filter((log) => log.total_xp >= 70).length || 0
  const avgXP = daysLogged > 0 ? Math.round(totalWeekXP / daysLogged) : 0
  const perfectWeek = daysGoalMet === 7

  const emailContent = {
    subject: `XP System Weekly Report - ${totalWeekXP} XP Earned!`,
    body: `
      Weekly Performance Report
      ========================
      
      OVERVIEW:
      - Total XP This Week: ${totalWeekXP}
      - Days Logged: ${daysLogged}/7
      - Goals Met: ${daysGoalMet}/7 days (70+ XP)
      - Average Daily XP: ${avgXP}
      
      PROFILE STATUS:
      - Total XP: ${profile.total_xp}
      - Level: ${profile.level}
      - Current Streak: ${profile.streak_days} days
      
      WEEKLY BREAKDOWN:
      ${weekLogs?.map((log) => `- ${log.log_date}: ${log.total_xp} XP (${log.quests_completed} quests)`).join("\n") || "No data"}
      
      ${perfectWeek ? "🏆 PERFECT WEEK! You're a LEGEND!" : daysGoalMet >= 5 ? "💪 Great week! Keep pushing!" : "📈 Room for improvement. You got this!"}
      
      View full analytics: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/analytics
    `,
  }

  await supabase.from("notifications").insert({
    user_id: PERSONAL_USER_ID,
    notification_type: "weekly_summary",
    email_content: emailContent,
    status: "pending",
    scheduled_for: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    message: "Weekly summary notification created",
    email: emailContent,
    stats: {
      total_week_xp: totalWeekXP,
      days_logged: daysLogged,
      days_goal_met: daysGoalMet,
      avg_xp: avgXP,
      perfect_week: perfectWeek,
    },
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/notifications/weekly",
    method: "POST",
    description: "Generates weekly summary email with XP stats and performance metrics",
  })
}
