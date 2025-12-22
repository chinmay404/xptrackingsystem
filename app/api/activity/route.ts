import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PERSONAL_USER_ID } from "@/lib/types"

// GET: Fetch activity log
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    activities,
    count: activities?.length || 0,
    limit,
    offset,
  })
}

// POST: Log custom activity
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { action_type, action_details, xp_change } = body

  const { data, error } = await supabase
    .from("activity_log")
    .insert({
      user_id: PERSONAL_USER_ID,
      action_type,
      action_details,
      xp_change: xp_change || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, activity: data })
}
