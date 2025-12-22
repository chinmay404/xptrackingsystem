import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/quests
 * Retrieves all available quests
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("quests").select("*").order("sort_order")

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      meta: {
        endpoint: "/api/quests",
        method: "GET",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch quests" }, { status: 500 })
  }
}

/**
 * POST /api/quests
 * Creates a new quest
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("quests")
      .insert({
        name: body.name,
        xp_value: body.xp_value,
        category: body.category,
        description: body.description,
        icon: body.icon || "⭐",
        sort_order: body.sort_order || 100,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        endpoint: "/api/quests",
        method: "POST",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create quest" }, { status: 500 })
  }
}
