import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Update user's fuel plan targets
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const updates: Record<string, any> = {}

  if (body.target_calories !== undefined) updates.target_calories = body.target_calories
  if (body.target_protein !== undefined) updates.target_protein = body.target_protein
  if (body.target_hydration !== undefined) updates.target_hydration = body.target_hydration
  if (body.target_deep_work !== undefined) updates.target_deep_work = body.target_deep_work
  if (body.username !== undefined) updates.username = body.username

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Get current user's profile
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return NextResponse.json({ profile })
}
