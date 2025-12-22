import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PERSONAL_USER_ID } from "@/lib/types"

// Random daily check-in API - call this via cron job
export async function POST() {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", PERSONAL_USER_ID).single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const today = new Date().toISOString().split("T")[0]
  const { data: todayLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", PERSONAL_USER_ID)
    .eq("log_date", today)
    .maybeSingle()

  const emailContent = {
    subject: "XP System Daily Check-In",
    body: `
      Hey Champion!
      
      Daily Status Check:
      - Today's XP: ${todayLog?.total_xp || 0} / 70 XP
      - Quests Completed: ${todayLog?.quests_completed || 0}
      - Total XP: ${profile.total_xp}
      - Current Level: ${profile.level}
      - Streak Days: ${profile.streak_days}
      
      ${(todayLog?.total_xp || 0) >= 70 ? "MISSION COMPLETE! Keep crushing it!" : "Keep going! You got this!"}
      
      Check your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}
    `,
  }

  // Log notification
  await supabase.from("notifications").insert({
    user_id: PERSONAL_USER_ID,
    notification_type: "daily_check_in",
    email_content: emailContent,
    status: "pending",
    scheduled_for: new Date().toISOString(),
  })

  // In production, integrate with email service like Resend
  // await resend.emails.send({ to: profile.email, ...emailContent })

  return NextResponse.json({
    success: true,
    message: "Check-in notification created",
    email: emailContent,
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/notifications/check-in",
    method: "POST",
    description: "Sends a random daily check-in email with current XP status",
  })
}
