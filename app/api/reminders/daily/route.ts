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
  const today = new Date().toISOString().split("T")[0]

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).maybeSingle()
  const { data: quests = [] } = await supabase.from("quests").select("*").order("sort_order")
  const { data: completions = [] } = await supabase
    .from("quest_completions")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("completion_date", today)

  const completedIds = new Set(completions.map((c) => c.quest_id))
  const positiveQuests = quests.filter((q) => q.xp_value > 0)
  const penaltyQuest = quests.find((q) => q.xp_value < 0)

  const dailyXP = positiveQuests.filter((q) => completedIds.has(q.id)).reduce((sum, q) => sum + q.xp_value, 0)
  const pending = positiveQuests.filter((q) => !completedIds.has(q.id))

  const html = `
    <div style="font-family: Inter, system-ui; color: #0f172a;">
      <h2 style="margin:0 0 8px;">Daily XP Briefing</h2>
      <p style="margin:0 0 12px;">Date: ${today}</p>
      <p style="margin:0 0 12px;">Total XP Today: <strong>${dailyXP}</strong> / 70</p>
      ${penaltyQuest ? `<p style="margin:0 0 12px; color:#dc2626;">Penalty: ${penaltyQuest.name} (${penaltyQuest.xp_value} XP)</p>` : ""}
      <h4 style="margin:16px 0 8px;">Pending Quests</h4>
      <ul style="padding-left:18px; margin:0 0 12px;">
        ${pending
          .map((q) => `<li>${q.name} (+${q.xp_value} XP)</li>`)
          .join("") || "<li>All clear. Great job!</li>"}
      </ul>
      <p style="margin-top:16px;">Keep pushing. One more quest can change the day.</p>
    </div>
  `

  const result = await sendMail({
    subject: `XP System • Daily Reminder (${dailyXP} XP)`,
    html,
  })

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
