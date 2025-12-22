import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PERSONAL_USER_ID } from "@/lib/types"

// Check for 2 days of inactivity and send reminder
export async function POST() {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const lastActive = profile.last_active_date ? new Date(profile.last_active_date) : null
  const now = new Date()
  const daysSinceActive = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 999

  if (daysSinceActive < 2) {
    return NextResponse.json({
      success: false,
      message: `User active ${daysSinceActive} days ago. No reminder needed.`,
      days_inactive: daysSinceActive,
    })
  }

  const emailContent = {
    subject: "XP System - We Miss You!",
    body: `
      Hey Champion!
      
      It's been ${daysSinceActive} days since you last logged your XP.
      
      Your stats are waiting:
      - Total XP: ${profile.total_xp}
      - Level: ${profile.level}
      - Streak: ${profile.streak_days} days (at risk!)
      
      Don't let your streak die! Every day counts.
      
      Get back on track: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}
      
      Remember: Small consistent actions > Big sporadic efforts
    `,
  }

  await supabase.from("notifications").insert({
    user_id: PERSONAL_USER_ID,
    notification_type: "inactivity_reminder",
    email_content: emailContent,
    status: "pending",
    scheduled_for: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    message: `Inactivity reminder created for ${daysSinceActive} days of inactivity`,
    email: emailContent,
    days_inactive: daysSinceActive,
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/notifications/inactive",
    method: "POST",
    description: "Checks if user has been inactive for 2+ days and sends reminder email",
  })
}
