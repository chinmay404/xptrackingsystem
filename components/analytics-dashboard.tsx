"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Calendar, Target, Award } from "lucide-react"
import type { DailyLog, Profile, Quest } from "@/lib/types"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface QuestCompletionWithQuest {
  id: string
  user_id: string
  quest_id: string
  completed_at: string
  completion_date: string
  xp_earned: number
  quests: {
    name: string
    category: string
    xp_value: number
  }
}

interface AnalyticsDashboardProps {
  profile: Profile | null
  dailyLogs: DailyLog[]
  questCompletions: QuestCompletionWithQuest[]
  quests: Quest[]
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]

export function AnalyticsDashboard({ profile, dailyLogs, questCompletions, quests }: AnalyticsDashboardProps) {
  // Calculate stats
  const totalDays = dailyLogs.length
  const averageXP = totalDays > 0 ? Math.round(dailyLogs.reduce((sum, log) => sum + log.total_xp, 0) / totalDays) : 0
  const bestDay = dailyLogs.reduce(
    (max, log) => (log.total_xp > max.total_xp ? log : max),
    dailyLogs[0] || { total_xp: 0 },
  )
  const completionRate =
    quests.length > 0 ? Math.round((questCompletions.length / (totalDays * quests.length)) * 100) : 0

  // Prepare chart data
  const xpChartData = dailyLogs.map((log) => ({
    date: new Date(log.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    xp: log.total_xp,
    quests: log.quests_completed,
  }))

  // Category breakdown
  const categoryStats = questCompletions.reduce(
    (acc, completion) => {
      const category = completion.quests.category
      if (!acc[category]) {
        acc[category] = { category, count: 0, xp: 0 }
      }
      acc[category].count++
      acc[category].xp += completion.xp_earned
      return acc
    },
    {} as Record<string, { category: string; count: number; xp: number }>,
  )

  const categoryData = Object.values(categoryStats)

  // Quest frequency
  const questFrequency = questCompletions.reduce(
    (acc, completion) => {
      const questName = completion.quests.name
      acc[questName] = (acc[questName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const questFrequencyData = Object.entries(questFrequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Weekly comparison
  const last7Days = dailyLogs.slice(-7).reduce((sum, log) => sum + log.total_xp, 0)
  const previous7Days = dailyLogs.slice(-14, -7).reduce((sum, log) => sum + log.total_xp, 0)
  const weeklyChange = previous7Days > 0 ? Math.round(((last7Days - previous7Days) / previous7Days) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total XP</CardDescription>
              <CardTitle className="text-3xl text-white">{profile?.total_xp || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>All time earnings</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Average XP/Day</CardDescription>
              <CardTitle className="text-3xl text-white">{averageXP}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Last {totalDays} days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Best Day</CardDescription>
              <CardTitle className="text-3xl text-white">{bestDay?.total_xp || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <Award className="w-4 h-4" />
                <span>Personal record</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Completion Rate</CardDescription>
              <CardTitle className="text-3xl text-white">{completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Target className="w-4 h-4" />
                <span>{questCompletions.length} quests done</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* XP Trend Chart */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">XP Trend (Last 30 Days)</CardTitle>
            <CardDescription className="text-slate-400">
              Daily XP earnings over time
              {weeklyChange !== 0 && (
                <span className={`ml-2 ${weeklyChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {weeklyChange > 0 ? "+" : ""}
                  {weeklyChange}% vs previous week
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={xpChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Category Breakdown</CardTitle>
              <CardDescription className="text-slate-400">XP earned by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, xp }) => `${category}: ${xp} XP`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="xp"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quest Frequency */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quest Completion Frequency</CardTitle>
              <CardDescription className="text-slate-400">Most completed quests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">Latest quest completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questCompletions.slice(0, 10).map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800"
                >
                  <div>
                    <p className="text-white font-medium">{completion.quests.name}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(completion.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">+{completion.xp_earned} XP</p>
                    <p className="text-xs text-slate-500">{completion.quests.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
