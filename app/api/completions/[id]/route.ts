import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"

/**
 * DELETE /api/completions/[id]
 * Removes a quest completion (undo)
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get completion details first
    const { data: completion, error: fetchError } = await supabase
      .from("quest_completions")
      .select("*, quests(*)")
      .eq("id", id)
      .single()

    if (fetchError || !completion) {
      return NextResponse.json({ success: false, error: "Completion not found" }, { status: 404 })
    }

    // Delete completion
    const { error } = await supabase.from("quest_completions").delete().eq("id", id)

    if (error) throw error

    // Update daily log
    const { data: existingLog } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", PERSONAL_USER_ID)
      .eq("log_date", completion.completion_date)
      .single()

    if (existingLog) {
      await supabase
        .from("daily_logs")
        .update({
          total_xp: Math.max(0, existingLog.total_xp - completion.xp_earned),
          quests_completed: Math.max(0, existingLog.quests_completed - 1),
        })
        .eq("id", existingLog.id)
    }

    // Update profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          total_xp: Math.max(0, profile.total_xp - completion.xp_earned),
        })
        .eq("id", PERSONAL_USER_ID)
    }

    return NextResponse.json({
      success: true,
      message: "Completion removed successfully",
      xp_deducted: completion.xp_earned,
      meta: {
        endpoint: `/api/completions/${id}`,
        method: "DELETE",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete completion" }, { status: 500 })
  }
}
