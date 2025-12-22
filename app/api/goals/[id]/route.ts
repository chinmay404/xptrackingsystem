import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const supabase = await createClient()

  const updates: Record<string, any> = {}
  if (body.current_value !== undefined) updates.current_value = body.current_value
  if (body.status !== undefined) updates.status = body.status
  if (body.status === "completed") updates.completed_at = new Date().toISOString()

  const { error } = await supabase.from("goals").update(updates).eq("id", id).eq("user_id", PERSONAL_USER_ID)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", PERSONAL_USER_ID)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
