import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/quests/[id]
 * Retrieves a specific quest by ID
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase.from("quests").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        endpoint: `/api/quests/${id}`,
        method: "GET",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch quest" }, { status: 500 })
  }
}

/**
 * PATCH /api/quests/[id]
 * Updates a specific quest
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("quests").update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        endpoint: `/api/quests/${id}`,
        method: "PATCH",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update quest" }, { status: 500 })
  }
}

/**
 * DELETE /api/quests/[id]
 * Deletes a specific quest
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from("quests").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Quest deleted successfully",
      meta: {
        endpoint: `/api/quests/${id}`,
        method: "DELETE",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete quest" }, { status: 500 })
  }
}
