import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get current user's friends and their profiles
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get accepted friends (both directions)
  const { data: friendships } = await supabase
    .from("friends")
    .select("*, friend:profiles!friends_friend_id_fkey(*), requester:profiles!friends_user_id_fkey(*)")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq("status", "accepted")

  const friends = friendships?.map((f) => {
    const isSender = f.user_id === user.id
    const friendProfile = isSender ? f.friend : f.requester
    return {
      friendship_id: f.id,
      ...friendProfile,
    }
  }) || []

  return NextResponse.json({ friends })
}

// Send friend request
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { friend_email } = await req.json()

  if (!friend_email) {
    return NextResponse.json({ error: "friend_email required" }, { status: 400 })
  }

  // Find friend by email in profiles
  const { data: friendProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", friend_email)
    .maybeSingle()

  if (!friendProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (friendProfile.id === user.id) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })
  }

  // Check existing friendship
  const { data: existing } = await supabase
    .from("friends")
    .select("id, status")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Friendship already exists", status: existing.status }, { status: 409 })
  }

  const { error } = await supabase.from("friends").insert({
    user_id: user.id,
    friend_id: friendProfile.id,
    status: "pending",
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
