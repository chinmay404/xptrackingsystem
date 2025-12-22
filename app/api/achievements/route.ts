import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PERSONAL_USER_ID } from "@/lib/types"

export async function GET() {
  const supabase = await createClient()

  const { data: achievements } = await supabase.from("achievements").select("*")
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", PERSONAL_USER_ID)

  return NextResponse.json({
    all: achievements || [],
    unlocked: unlocked || [],
  })
}
