import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Update custom quest
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const updates: Record<string, any> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.xp_value !== undefined) updates.xp_value = body.xp_value
  if (body.category !== undefined) updates.category = body.category
  if (body.description !== undefined) updates.description = body.description
  if (body.icon !== undefined) updates.icon = body.icon
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  const { error } = await supabase
    .from("quests")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id) // Only own quests

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Delete custom quest
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("quests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id) // Only own quests

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
