import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"

export async function GET() {
  const supabase = await createClient()

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]

  const { data: logs = [] } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .gte("log_date", yearStart)
    .order("log_date")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).maybeSingle()

  if (!logs.length) {
    return NextResponse.json({
      totalDays: 0,
      passDays: 0,
      eliteDays: 0,
      failDays: 0,
      averageXP: 0,
      bestDay: null,
      worstDay: null,
      currentStreak: profile?.current_streak || 0,
      longestStreak: profile?.longest_streak || 0,
      weekdayAvg: {},
      suggestions: ["Start logging to see insights!"],
    })
  }

  const passDays = logs.filter((l) => l.total_xp >= 70).length
  const eliteDays = logs.filter((l) => l.total_xp >= 100).length
  const failDays = logs.filter((l) => l.total_xp < 70 && l.total_xp > 0).length
  const totalXP = logs.reduce((s, l) => s + (l.total_xp || 0), 0)
  const averageXP = Math.round(totalXP / logs.length)

  const sortedByXP = [...logs].sort((a, b) => b.total_xp - a.total_xp)
  const bestDay = sortedByXP[0]
  const worstDay = sortedByXP[sortedByXP.length - 1]

  // Weekday average
  const weekdayTotals: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  logs.forEach((l) => {
    const d = new Date(l.log_date).getDay()
    weekdayTotals[d].push(l.total_xp)
  })
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weekdayAvg: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const arr = weekdayTotals[i]
    weekdayAvg[weekdayNames[i]] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
  }

  // Basic suggestions
  const suggestions: string[] = []
  const worstWeekday = Object.entries(weekdayAvg).sort((a, b) => a[1] - b[1])[0]
  if (worstWeekday && worstWeekday[1] < 70) {
    suggestions.push(`${worstWeekday[0]} is your weakest day (${worstWeekday[1]} avg). Plan extra focus.`)
  }
  if (averageXP < 70) {
    suggestions.push("Average XP is below 70. Consider simplifying your quest list or stacking early wins.")
  }
  if (eliteDays < passDays * 0.3) {
    suggestions.push("Few elite days. Push for 100+ XP on strong days to boost momentum.")
  }
  if (profile?.current_streak && profile.current_streak >= 7) {
    suggestions.push(`You're on a ${profile.current_streak}-day streak. Don't break the chain!`)
  }

  return NextResponse.json({
    totalDays: logs.length,
    passDays,
    eliteDays,
    failDays,
    averageXP,
    bestDay: { date: bestDay.log_date, xp: bestDay.total_xp },
    worstDay: { date: worstDay.log_date, xp: worstDay.total_xp },
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    weekdayAvg,
    suggestions,
  })
}
