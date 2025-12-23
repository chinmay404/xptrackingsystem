import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const action = formData.get("action") as string

  const supabase = await createClient()

  if (action === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Skip email confirmation for personal app
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url))
    }

    // Create profile for new user
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username: email.split("@")[0],
        email,
        total_xp: 0,
        level: 1,
        streak_days: 0,
      })
    }

    // If email confirmation is disabled in Supabase, user is auto-confirmed
    if (data.session) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // If email confirmation is required, show message
    return NextResponse.redirect(new URL("/login?message=Check your email to confirm your account", req.url))
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
