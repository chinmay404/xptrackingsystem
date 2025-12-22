import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"
import { emailEnabled, sendMail } from "@/lib/email"

function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

const prompts = [
  "System check: sync your XP before day end.",
  "Micro-quest: clear one task now for +10 momentum.",
  "Hydrate + log one quest. Small wins stack.",
  "Penalty avoidance: stay clear of the hazard zone.",
  "Deep focus: start a 25-minute sprint and log it.",
]

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
  const pending = quests.filter((q) => q.xp_value > 0 && !completedIds.has(q.id))
  const dailyXP = quests.filter((q) => completedIds.has(q.id) && q.xp_value > 0).reduce((s, q) => s + q.xp_value, 0)

  const prompt = prompts[Math.floor(Math.random() * prompts.length)]

  const html = `
    <div style="font-family: Inter, system-ui; color: #0f172a;">
      <p style="margin:0 0 10px;">${prompt}</p>
      <p style="margin:0 0 8px;">XP Today: <strong>${dailyXP}</strong> / 70</p>
      <h4 style="margin:12px 0 6px;">Pending</h4>
      <ul style="padding-left:18px; margin:0;">
        ${pending.map((q) => `<li>${q.name} (+${q.xp_value} XP)</li>`).join("") || "<li>All quests done. Nice.</li>"}
      </ul>
    </div>
  `

  const result = await sendMail({
    subject: `XP System • Check-in (${dailyXP} XP so far)`,
    html,
  })

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
