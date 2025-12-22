import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

/**
 * GET /api/profile
 * Retrieves the user's profile including XP, level, and streak information
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        endpoint: "/api/profile",
        method: "GET",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}

/**
 * PATCH /api/profile
 * Updates the user's profile
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("profiles").update(body).eq("id", PERSONAL_USER_ID).select().single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        endpoint: "/api/profile",
        method: "PATCH",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
