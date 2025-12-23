import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Passwordless magic-link auth for simplest UX
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const name = (formData.get("name") as string)?.trim()

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=Email is required", req.url))
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      data: name ? { display_name: name } : undefined,
    },
  })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url))
  }

  return NextResponse.redirect(new URL("/login?message=Check your email for a magic link", req.url))
}
