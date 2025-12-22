import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

/**
 * GET /api/completions
 * Retrieves quest completions with optional date filtering
 * Query params: date (YYYY-MM-DD), from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const supabase = await createClient()
    let query = supabase
      .from("quest_completions")
      .select("*, quests(*)")
      .eq("user_id", PERSONAL_USER_ID)
      .order("completed_at", { ascending: false })

    if (date) {
      query = query.eq("completion_date", date)
    } else {
      if (from) query = query.gte("completion_date", from)
      if (to) query = query.lte("completion_date", to)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      meta: {
        endpoint: "/api/completions",
        method: "GET",
        filters: { date, from, to },
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch completions" }, { status: 500 })
  }
}

/**
 * POST /api/completions
 * Records a quest completion
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const today = new Date().toISOString().split("T")[0]

    // Get quest details
    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("*")
      .eq("id", body.quest_id)
      .single()

    if (questError || !quest) {
      return NextResponse.json({ success: false, error: "Quest not found" }, { status: 404 })
    }

    // Insert completion
    const { data: completion, error: completionError } = await supabase
      .from("quest_completions")
      .insert({
        user_id: PERSONAL_USER_ID,
        quest_id: body.quest_id,
        completion_date: body.date || today,
        xp_earned: quest.xp_value,
      })
      .select()
      .single()

    if (completionError) throw completionError

    // Update daily log
    const logDate = body.date || today
    const { data: existingLog } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .eq("log_date", logDate)
      .single()

    if (existingLog) {
      await supabase
        .from("daily_logs")
        .update({
          total_xp: existingLog.total_xp + quest.xp_value,
          quests_completed: existingLog.quests_completed + 1,
        })
        .eq("id", existingLog.id)
    } else {
      await supabase.from("daily_logs").insert({
        user_id: PERSONAL_USER_ID,
        log_date: logDate,
        total_xp: quest.xp_value,
        quests_completed: 1,
      })
    }

    // Update profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

    if (profile) {
      const newTotalXP = profile.total_xp + quest.xp_value
      const newLevel = Math.floor(newTotalXP / 500) + 1

      await supabase
        .from("profiles")
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          last_active_date: today,
        })
        .eq("id", PERSONAL_USER_ID)
    }

    return NextResponse.json({
      success: true,
      data: completion,
      xp_earned: quest.xp_value,
      meta: {
        endpoint: "/api/completions",
        method: "POST",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to record completion" }, { status: 500 })
  }
}
