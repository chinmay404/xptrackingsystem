import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

/**
 * GET /api/logs
 * Retrieves daily logs with optional date filtering
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), limit (number)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = Number.parseInt(searchParams.get("limit") || "30")

    const supabase = await createClient()
    let query = supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .order("log_date", { ascending: false })
      .limit(limit)

    if (from) query = query.gte("log_date", from)
    if (to) query = query.lte("log_date", to)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      meta: {
        endpoint: "/api/logs",
        method: "GET",
        filters: { from, to, limit },
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch logs" }, { status: 500 })
  }
}
