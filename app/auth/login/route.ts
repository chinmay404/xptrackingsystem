import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Simple email + password auth (no magic links)
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = (formData.get("password") as string)?.trim()
  const name = (formData.get("name") as string)?.trim()
  const action = (formData.get("action") as string) || "login"

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=Email and password are required", req.url))
  }

  const supabase = await createClient()

  if (action === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: name ? { display_name: name } : undefined,
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url))
    }

    // Create profile for new user when session is ready
    if (data.user) {
      const displayName =
        name ||
        (data.user.user_metadata as Record<string, string> | null)?.display_name ||
        data.user.email?.split("@")[0] ||
        "player"

      await supabase.from("profiles").upsert({
        id: data.user.id,
        username: displayName,
        email,
        total_xp: 0,
        level: 1,
        streak_days: 0,
      })
    }

    // Attempt immediate login
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      return NextResponse.redirect(
        new URL(
          `/login?message=Account created. Please log in with your password` ,
          req.url
        )
      )
    }

    return NextResponse.redirect(new URL("/", req.url))
  }

  // Login
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url))
  }

  return NextResponse.redirect(new URL("/", req.url))
}
