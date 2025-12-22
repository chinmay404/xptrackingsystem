import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get user's custom quests (+ global templates)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .or(`is_global.eq.true,user_id.eq.${user.id}`)
    .order("sort_order")

  return NextResponse.json({ quests: quests || [] })
}

// Create custom quest
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, xp_value, category, description, icon } = body

  if (!name || xp_value === undefined) {
    return NextResponse.json({ error: "name and xp_value required" }, { status: 400 })
  }

  // Get max sort_order for user
  const { data: existing } = await supabase
    .from("quests")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order || 100) + 1

  const { data, error } = await supabase
    .from("quests")
    .insert({
      user_id: user.id,
      name,
      xp_value,
      category: category || "custom",
      description,
      icon,
      sort_order: nextOrder,
      is_global: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quest: data })
}
