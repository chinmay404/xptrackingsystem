import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .order("created_at", { ascending: false })

  return NextResponse.json({ goals: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, target_value, unit, deadline } = body

  if (!name || !target_value) {
    return NextResponse.json({ ok: false, error: "name and target_value required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from("goals").insert({
    user_id: PERSONAL_USER_ID,
    name,
    target_value,
    unit: unit || "XP",
    deadline: deadline || null,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
