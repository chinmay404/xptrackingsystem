import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  const supabase = await createClient()
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("entry_date", date)
    .maybeSingle()

  return NextResponse.json({ entry: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const date = body.date || new Date().toISOString().split("T")[0]
  const content = body.content ?? null
  const mood = body.mood ?? null
  const energy = body.energy ?? null

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("entry_date", date)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("journal_entries")
      .update({ content, mood, energy, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from("journal_entries").insert({
      user_id: PERSONAL_USER_ID,
      entry_date: date,
      content,
      mood,
      energy,
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
