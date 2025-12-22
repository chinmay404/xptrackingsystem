import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PERSONAL_USER_ID } from "@/lib/types"

// GET: Fetch today's timer sessions
export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: sessions, error } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("session_date", today)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0

  return NextResponse.json({
    sessions,
    total_seconds: totalSeconds,
    total_hours: (totalSeconds / 3600).toFixed(2),
    target_hours: 4,
    progress_percent: Math.min((totalSeconds / (4 * 3600)) * 100, 100).toFixed(1),
  })
}

// POST: Create or update timer session
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { duration_seconds, action } = body
  const today = new Date().toISOString().split("T")[0]

  if (action === "start") {
    const { data, error } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: PERSONAL_USER_ID,
        session_date: today,
        duration_seconds: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: data })
  }

  if (action === "update" && body.session_id) {
    const { data, error } = await supabase
      .from("timer_sessions")
      .update({
        duration_seconds,
        ended_at: new Date().toISOString(),
      })
      .eq("id", body.session_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: data })
  }

  if (action === "reset") {
    const { error } = await supabase
      .from("timer_sessions")
      .delete()
      .eq("user_id", PERSONAL_USER_ID)
      .eq("session_date", today)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Timer reset" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
