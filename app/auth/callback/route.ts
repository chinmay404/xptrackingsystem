import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if profile exists, create if not
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single()

      if (!profile) {
        const displayName =
          (data.user.user_metadata as Record<string, string> | null)?.display_name ||
          data.user.email?.split("@")[0] ||
          "player"

        await supabase.from("profiles").insert({
          id: data.user.id,
          username: displayName,
          email: data.user.email,
          total_xp: 0,
          level: 1,
          streak_days: 0,
        })
      }

      return NextResponse.redirect(new URL(next, req.url))
    }
  }

  // Return to login with error
  return NextResponse.redirect(new URL("/login?error=Could not authenticate", req.url))
}
