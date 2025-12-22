import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Code, Zap, Database, Bell, Activity } from "lucide-react"

const endpoints = [
  {
    category: "Profile",
    icon: "👤",
    routes: [
      {
        method: "GET",
        path: "/api/profile",
        description: "Get user profile with XP, level, and streak",
        response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "total_xp": 1250,
    "level": 3,
    "streak_days": 7,
    "last_active_date": "2025-01-15"
  }
}`,
      },
      {
        method: "PATCH",
        path: "/api/profile",
        description: "Update user profile",
        body: `{ "username": "NewName" }`,
        response: `{ "success": true, "data": {...} }`,
      },
    ],
  },
  {
    category: "Quests",
    icon: "⚔️",
    routes: [
      {
        method: "GET",
        path: "/api/quests",
        description: "List all available quests",
        response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Complete Workout",
    "xp_value": 30,
    "category": "Fitness",
    "icon": "💪"
  }],
  "count": 8
}`,
      },
      {
        method: "POST",
        path: "/api/quests",
        description: "Create a new quest",
        body: `{
  "name": "Read 30 mins",
  "xp_value": 15,
  "category": "Wellness",
  "icon": "📚"
}`,
        response: `{ "success": true, "data": {...} }`,
      },
    ],
  },
  {
    category: "Completions",
    icon: "✅",
    routes: [
      {
        method: "GET",
        path: "/api/completions",
        description: "Get quest completions with filtering",
        params: "?date=2025-01-15 or ?from=2025-01-01&to=2025-01-31",
        response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "quest_id": "uuid",
    "completion_date": "2025-01-15",
    "xp_earned": 30
  }],
  "count": 5
}`,
      },
      {
        method: "POST",
        path: "/api/completions",
        description: "Record a quest completion",
        body: `{ "quest_id": "uuid" }`,
        response: `{ "success": true, "xp_earned": 30 }`,
      },
    ],
  },
  {
    category: "Daily Logs",
    icon: "📅",
    routes: [
      {
        method: "GET",
        path: "/api/logs",
        description: "Get daily activity logs",
        params: "?from=2025-01-01&to=2025-01-31&limit=30",
        response: `{
  "success": true,
  "data": [{
    "log_date": "2025-01-15",
    "total_xp": 85,
    "quests_completed": 6
  }]
}`,
      },
    ],
  },
  {
    category: "Statistics",
    icon: "📊",
    routes: [
      {
        method: "GET",
        path: "/api/stats",
        description: "Get comprehensive analytics",
        response: `{
  "success": true,
  "data": {
    "profile": {...},
    "overview": {
      "total_days_tracked": 45,
      "average_xp_per_day": 68,
      "goals_achieved": 32,
      "completion_rate": 71
    }
  }
}`,
      },
    ],
  },
  {
    category: "Timer Sessions",
    icon: "⏱️",
    routes: [
      {
        method: "GET",
        path: "/api/timer",
        description: "Get today's deep work timer sessions",
        response: `{
  "sessions": [...],
  "total_seconds": 7200,
  "total_hours": "2.00",
  "target_hours": 4,
  "progress_percent": "50.0"
}`,
      },
      {
        method: "POST",
        path: "/api/timer",
        description: "Start, update, or reset timer",
        body: `{
  "action": "start" | "update" | "reset",
  "session_id": "uuid", // for update
  "duration_seconds": 3600 // for update
}`,
        response: `{ "success": true, "session": {...} }`,
      },
    ],
  },
  {
    category: "Activity Log",
    icon: "📝",
    routes: [
      {
        method: "GET",
        path: "/api/activity",
        description: "Get detailed activity history",
        params: "?limit=50&offset=0",
        response: `{
  "activities": [{
    "action_type": "quest_completed",
    "action_details": {...},
    "xp_change": 30,
    "created_at": "..."
  }],
  "count": 50
}`,
      },
      {
        method: "POST",
        path: "/api/activity",
        description: "Log custom activity",
        body: `{
  "action_type": "custom_event",
  "action_details": {...},
  "xp_change": 0
}`,
        response: `{ "success": true, "activity": {...} }`,
      },
    ],
  },
  {
    category: "Notifications",
    icon: "🔔",
    routes: [
      {
        method: "POST",
        path: "/api/notifications/check-in",
        description: "Send daily check-in email with XP status",
        response: `{
  "success": true,
  "message": "Check-in notification created",
  "email": {
    "subject": "XP System Daily Check-In",
    "body": "..."
  }
}`,
      },
      {
        method: "POST",
        path: "/api/notifications/inactive",
        description: "Send reminder if inactive for 2+ days",
        response: `{
  "success": true,
  "days_inactive": 3,
  "email": {...}
}`,
      },
      {
        method: "POST",
        path: "/api/notifications/weekly",
        description: "Send weekly performance summary",
        response: `{
  "success": true,
  "stats": {
    "total_week_xp": 480,
    "days_logged": 7,
    "days_goal_met": 5,
    "perfect_week": false
  },
  "email": {...}
}`,
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function DocsPage() {
  return (
    <div className="min-h-screen cyber-bg">
      {/* Header */}
      <header className="border-b border-cyan-900/50 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white cyber-text">API DOCUMENTATION</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Intro */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white mb-4 tracking-wider">XP QUEST API</h2>
          <p className="text-slate-400 text-lg mb-6">
            A complete RESTful API for your gamified habit tracking system. All endpoints are production-ready with
            database persistence.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="cyber-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-white font-semibold">RESTful</p>
                <p className="text-xs text-slate-500">Standard HTTP</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-white font-semibold">Supabase</p>
                <p className="text-xs text-slate-500">PostgreSQL</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-white font-semibold">Notifications</p>
                <p className="text-xs text-slate-500">Email ready</p>
              </div>
            </div>
            <div className="cyber-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-white font-semibold">Activity Log</p>
                <p className="text-xs text-slate-500">Full history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cron Jobs Setup */}
        <div className="cyber-card p-6 mb-8">
          <h3 className="text-lg font-bold text-cyan-400 mb-4 tracking-wider">AUTOMATED NOTIFICATIONS SETUP</h3>
          <p className="text-slate-400 mb-4">Set up these cron jobs in Vercel or your hosting provider:</p>
          <div className="space-y-3 font-mono text-sm">
            <div className="bg-slate-800 p-3 rounded-lg">
              <p className="text-emerald-400">Daily Check-in (random time 9am-6pm)</p>
              <code className="text-slate-300">POST /api/notifications/check-in</code>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <p className="text-amber-400">Inactivity Check (daily at 8pm)</p>
              <code className="text-slate-300">POST /api/notifications/inactive</code>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <p className="text-blue-400">Weekly Summary (Sundays at 9am)</p>
              <code className="text-slate-300">POST /api/notifications/weekly</code>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          {endpoints.map((section) => (
            <div key={section.category} className="cyber-card overflow-hidden">
              <div className="bg-slate-800/50 p-4 border-b border-slate-700">
                <h3 className="text-white font-bold flex items-center gap-3 tracking-wider">
                  <span className="text-2xl">{section.icon}</span>
                  {section.category.toUpperCase()}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {section.routes.map((route, idx) => (
                  <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/30 p-3 flex flex-wrap items-center gap-3">
                      <Badge className={`${methodColors[route.method]} font-mono text-xs`}>{route.method}</Badge>
                      <code className="text-cyan-400 text-sm">{route.path}</code>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-slate-400 text-sm">{route.description}</p>

                      {route.params && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Query Parameters</p>
                          <code className="text-xs text-blue-400 bg-slate-800 px-2 py-1 rounded">{route.params}</code>
                        </div>
                      )}

                      {route.body && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Request Body</p>
                          <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto">
                            <code className="text-amber-400">{route.body}</code>
                          </pre>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Response</p>
                        <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto max-h-48">
                          <code className="text-emerald-400">{route.response}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Email Integration Note */}
        <div className="cyber-card-danger p-6 mt-8">
          <h3 className="text-red-400 font-bold mb-3 tracking-wider">EMAIL INTEGRATION</h3>
          <p className="text-slate-400 text-sm">
            The notification endpoints generate email content but require an email service integration (like Resend,
            SendGrid, or Postmark) to actually send emails. Add your email service in the notification route handlers
            and set your email address in the profile.
          </p>
          <pre className="bg-slate-800 p-3 rounded mt-4 text-xs overflow-x-auto">
            <code className="text-slate-300">{`// Example with Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'XP System <noreply@yourdomain.com>',
  to: profile.email,
  subject: emailContent.subject,
  text: emailContent.body,
});`}</code>
          </pre>
        </div>
      </main>
    </div>
  )
}
