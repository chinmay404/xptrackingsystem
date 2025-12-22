import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"
import { emailEnabled, sendMail } from "@/lib/email"

function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function GET() {
  if (!emailEnabled) {
    return NextResponse.json({ ok: false, error: "Email not configured (set RESEND_API_KEY, EMAIL_FROM, EMAIL_TO)" }, { status: 500 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 })
  }

  const supabase = await createClient()
  const now = new Date()
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)

  const startStr = start.toISOString().split("T")[0]
  const endStr = end.toISOString().split("T")[0]

  const { data: logs = [] } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .gte("log_date", startStr)
    .lte("log_date", endStr)
    .order("log_date")

  const totalXP = logs.reduce((sum, l) => sum + (l.total_xp || 0), 0)
  const passes = logs.filter((l) => l.total_xp >= 70).length
  const elites = logs.filter((l) => l.total_xp >= 100).length
  const streak = computeStreak(logs)

  const html = `
    <div style="font-family: Inter, system-ui; color: #0f172a;">
      <h2 style="margin:0 0 8px;">Weekly XP Report</h2>
      <p style="margin:0 0 12px;">Range: ${startStr} → ${endStr}</p>
      <p style="margin:0 0 8px;">Total XP: <strong>${totalXP}</strong></p>
      <p style="margin:0 0 8px;">Pass Days (≥70 XP): <strong>${passes}</strong></p>
      <p style="margin:0 0 8px;">Elite Days (≥100 XP): <strong>${elites}</strong></p>
      <p style="margin:0 0 12px;">Current Week Streak: <strong>${streak}</strong> day(s)</p>
      <h4 style="margin:16px 0 8px;">Daily Breakdown</h4>
      <ul style="padding-left:18px; margin:0;">
        ${logs
          .map((l) => `<li>${l.log_date}: ${l.total_xp} XP (${l.quests_completed} quests)</li>`)
          .join("") || "<li>No data this week.</li>"}
      </ul>
    </div>
  `

  const result = await sendMail({
    subject: `XP System • Weekly Report (${passes} pass / ${elites} elite)`,
    html,
  })

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function computeStreak(logs: { log_date: string; total_xp: number }[]) {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  let streak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].total_xp >= 70) streak++
    else break
  }
  return streak
}
