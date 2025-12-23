"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Quest, QuestCompletion, Profile, DailyLog, JournalEntry } from "@/lib/types"
import {
  BarChart3,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Dumbbell,
  Target,
  Clock,
  Moon,
  Sparkles,
  ShowerHead,
  Scissors,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Ban,
  Heart,
  Battery,
  PenLine,
  Award,
  TrendingUp,
} from "lucide-react"

interface XPDashboardProps {
  profile: Profile | null
  quests: Quest[]
  completions: QuestCompletion[]
  userId: string
  yearLogs: DailyLog[]
  initialTimerSeconds?: number
  initialJournal?: JournalEntry | null
}

// Sound effects hook
function useSoundEffects() {
  const [muted, setMuted] = useState(false)
  const audioContext = useRef<AudioContext | null>(null)

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext.current
  }

  const playSound = useCallback(
    (type: "complete" | "levelup" | "penalty" | "click" | "success") => {
      if (muted) return
      try {
        const ctx = initAudio()
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        switch (type) {
          case "complete":
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime)
            oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
            oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.4)
            break
          case "levelup":
            oscillator.frequency.setValueAtTime(261.63, ctx.currentTime)
            oscillator.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15)
            oscillator.frequency.setValueAtTime(392.0, ctx.currentTime + 0.3)
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.45)
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.8)
            break
          case "penalty":
            oscillator.type = "sawtooth"
            oscillator.frequency.setValueAtTime(200, ctx.currentTime)
            oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.2)
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.4)
            break
          case "click":
            oscillator.frequency.setValueAtTime(800, ctx.currentTime)
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.05)
            break
          case "success":
            oscillator.frequency.setValueAtTime(880, ctx.currentTime)
            oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1)
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.3)
            break
        }
      } catch (e) {
        console.log("Audio not available")
      }
    },
    [muted],
  )

  return { playSound, muted, setMuted }
}

// Confetti component
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ["#00f0ff", "#ff0055", "#00ff88", "#ffaa00", "#ff00ff"][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)
      const timer = setTimeout(() => setParticles([]), 2500)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  if (!isActive && particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}

// Neutral burst for zero-XP completions
function NeutralBurst({ isActive }: { isActive: boolean }) {
  if (!isActive) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping" />
        <div className="absolute inset-4 rounded-full border border-emerald-400/40 animate-ping" style={{ animationDelay: "120ms" }} />
        <div className="absolute inset-8 rounded-full border border-amber-400/40 animate-ping" style={{ animationDelay: "240ms" }} />
      </div>
    </div>
  )
}

// XP Popup
function XPPopup({ xp, isVisible, isNegative }: { xp: number; isVisible: boolean; isNegative?: boolean }) {
  if (!isVisible) return null
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div
        className={`animate-xp-popup flex items-center gap-3 px-8 py-5 rounded-lg border-2 ${
          isNegative ? "bg-red-950/90 border-red-500 text-red-400" : "bg-cyan-950/90 border-cyan-400 text-cyan-400"
        }`}
        style={{ boxShadow: isNegative ? "0 0 30px rgba(255,0,85,0.5)" : "0 0 30px rgba(0,240,255,0.5)" }}
      >
        <Zap className="w-10 h-10" />
        <span className="text-5xl font-black font-mono">
          {isNegative ? "" : "+"}
          {xp} XP
        </span>
      </div>
    </div>
  )
}

// Level Up Overlay
function LevelUpOverlay({ level, isVisible, onClose }: { level: number; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="text-center animate-scale-in">
        <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-pulse-glow cyber-glow">
          <Trophy className="w-20 h-20 text-white" />
        </div>
        <h2 className="text-6xl font-black text-cyan-400 mb-4 tracking-wider glitch-text">LEVEL UP!</h2>
        <p className="text-8xl font-black text-white cyber-text">{level}</p>
        <p className="text-slate-400 mt-6 text-xl tracking-widest uppercase">System Upgraded</p>
      </div>
    </div>
  )
}

// Goal Achieved Overlay
function GoalAchievedOverlay({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="text-center animate-scale-in">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center animate-pulse-glow">
          <Target className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-5xl font-black text-emerald-400 mb-2 tracking-wider">MISSION COMPLETE</h2>
        <p className="text-2xl text-white font-mono">70+ XP ACHIEVED</p>
        <p className="text-slate-400 mt-4 text-lg">Daily objective secured</p>
      </div>
    </div>
  )
}

// Deep Coding Timer with DB logging
function DeepCodingTimer({
  onComplete,
  playSound,
  userId,
  initialSeconds = 0,
  isDemo = false,
}: {
  onComplete: () => void
  playSound: (type: "complete" | "click") => void
  userId: string
  initialSeconds?: number
  isDemo?: boolean
}) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const supabase = isDemo ? null : createClient()
  const targetHours = 4
  const targetSeconds = targetHours * 60 * 60
  const lastLogRef = useRef(seconds)

  // Log timer to DB every 30 seconds
  useEffect(() => {
    if (!isRunning || isDemo || !supabase) return

    const logInterval = setInterval(async () => {
      const today = new Date().toISOString().split("T")[0]

      if (sessionId && supabase) {
        await supabase
          .from("timer_sessions")
          .update({ duration_seconds: seconds, ended_at: new Date().toISOString() })
          .eq("id", sessionId)
      }
      lastLogRef.current = seconds
    }, 30000) // Log every 30 seconds

    return () => clearInterval(logInterval)
  }, [isRunning, seconds, sessionId, supabase])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= targetSeconds) {
            setIsRunning(false)
            onComplete()
            return targetSeconds
          }
          return s + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, targetSeconds, onComplete])

  const handleStart = async () => {
    playSound("click")
    setIsRunning(true)

    if (isDemo || !supabase) return

    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: userId,
        session_date: today,
        duration_seconds: seconds,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (data) setSessionId(data.id)
  }

  const handlePause = async () => {
    playSound("click")
    setIsRunning(false)

    if (isDemo || !supabase) return

    if (sessionId) {
      await supabase
        .from("timer_sessions")
        .update({ duration_seconds: seconds, ended_at: new Date().toISOString() })
        .eq("id", sessionId)
    }
  }

  const handleReset = async () => {
    playSound("click")
    setSeconds(0)
    setIsRunning(false)
    setSessionId(null)

    if (isDemo || !supabase) return

    const today = new Date().toISOString().split("T")[0]
    await supabase.from("timer_sessions").delete().eq("user_id", userId).eq("session_date", today)
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = (seconds / targetSeconds) * 100

  return (
    <div className="cyber-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src="/dark-coding-setup-with-monitors-neon-lights.jpg" alt="Coding setup" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 font-bold tracking-wider">DEEP CODING TRACKER</h3>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Commit to {targetHours} hours of focused, distraction-free deep work. Auto-saves to database.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-5xl font-mono font-bold text-white tracking-wider cyber-text">{formatTime(seconds)}</div>
          <div className="flex gap-2">
            <button
              onClick={isRunning ? handlePause : handleStart}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRunning
                  ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                  : "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30"
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full bg-slate-800/50 border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700/50 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-2 font-mono">
            TARGET: {targetHours}hr FOR FULL QUEST COMPLETION • AUTO-LOGGED TO DB
          </p>
        </div>
      </div>
    </div>
  )
}

// Quest icon mapping
const questIcons: Record<string, any> = {
  "Complete Workout": Dumbbell,
  "Hit Macros (160g Protein)": Target,
  "0 Minutes Porn": Ban,
  "4 Hours Deep Coding": Clock,
  "7+ Hours Sleep": Moon,
  "Cold Shower": ShowerHead,
  "Grooming (Face/Beard)": Scissors,
  "Fail Condition: Fapping / Skipping Gym": AlertTriangle,
}

// Get rank based on level
function getRank(level: number): string {
  if (level <= 1) return "NEWBIE"
  if (level <= 5) return "INITIATE"
  if (level <= 10) return "WARRIOR"
  if (level <= 20) return "VETERAN"
  if (level <= 35) return "ELITE"
  if (level <= 50) return "MASTER"
  return "LEGEND"
}

// Get status based on daily XP
function getStatus(dailyXP: number, xpGoal: number): { text: string; color: string } {
  const percent = (dailyXP / xpGoal) * 100
  if (percent >= 100) return { text: "MISSION COMPLETE", color: "text-emerald-400" }
  if (percent >= 70) return { text: "STATUS: SYNCING", color: "text-cyan-400" }
  if (percent >= 40) return { text: "STATUS: CRITICAL", color: "text-amber-400" }
  return { text: "STATUS: FAILING", color: "text-red-500" }
}

export function XPDashboard({
  profile,
  quests,
  completions,
  userId,
  yearLogs,
  initialTimerSeconds = 0,
  initialJournal = null,
}: XPDashboardProps) {
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set(completions.map((c) => c.quest_id)))
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
    const [showNeutralBurst, setShowNeutralBurst] = useState(false)
  const [xpPopup, setXpPopup] = useState<{ xp: number; visible: boolean; isNegative?: boolean }>({
    xp: 0,
    visible: false,
  })
  const [levelUp, setLevelUp] = useState<{ level: number; visible: boolean }>({ level: 0, visible: false })
  const [goalAchieved, setGoalAchieved] = useState(false)
  const [previousDailyXP, setPreviousDailyXP] = useState(0)
  const { playSound, muted, setMuted } = useSoundEffects()
  const isDemo = userId === "demo"
  const router = useRouter()

  // Journal / mood / energy state
  const [mood, setMood] = useState(initialJournal?.mood || 3)
  const [energy, setEnergy] = useState(initialJournal?.energy || 3)
  const [journalText, setJournalText] = useState(initialJournal?.content || "")
  const [journalSaving, setJournalSaving] = useState(false)
  const supabase = isDemo ? null : createClient()

  const dailyXP = quests
    .filter((q) => completedQuests.has(q.id) && q.xp_value > 0)
    .reduce((sum, q) => sum + q.xp_value, 0)
  const xpGoal = 70
  const progressPercent = Math.min((dailyXP / xpGoal) * 100, 100)
  const status = getStatus(dailyXP, xpGoal)
  const rank = getRank(profile?.level || 1)

  useEffect(() => {
    if (dailyXP >= xpGoal && previousDailyXP < xpGoal && previousDailyXP !== 0) {
      setGoalAchieved(true)
      setShowConfetti(true)
      playSound("success")
    }
    setPreviousDailyXP(dailyXP)
  }, [dailyXP, previousDailyXP, playSound])

  const handleCloseGoal = useCallback(() => setGoalAchieved(false), [])
  const handleCloseLevelUp = useCallback(() => setLevelUp({ level: 0, visible: false }), [])

  // Save journal / mood / energy
  const saveJournal = useCallback(async () => {
    if (isDemo) return
    setJournalSaving(true)
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: journalText, mood, energy }),
      })
    } finally {
      setJournalSaving(false)
    }
  }, [isDemo, journalText, mood, energy])

  // Log activity to database
  const logActivity = async (actionType: string, details: Record<string, any>, xpChange: number) => {
    if (!supabase) return
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: actionType,
      action_details: details,
      xp_change: xpChange,
    })
  }

  const handleToggleQuest = async (quest: Quest, checked: boolean) => {
    setIsLoading(quest.id)
    const today = new Date().toISOString().split("T")[0]

    try {
      if (checked) {
        if (quest.xp_value > 0) {
          playSound("complete")
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 2500)
        } else if (quest.xp_value < 0) {
          playSound("penalty")
        } else {
          // Zero XP tasks still get a visual burst and click sound
          playSound("click")
          setShowNeutralBurst(true)
          setTimeout(() => setShowNeutralBurst(false), 1200)
        }

        setXpPopup({ xp: Math.abs(quest.xp_value), visible: true, isNegative: quest.xp_value < 0 })
        setTimeout(() => setXpPopup({ xp: 0, visible: false }), 1500)

        if (supabase) {
          await supabase.from("quest_completions").insert({
            user_id: userId,
            quest_id: quest.id,
            completion_date: today,
            xp_earned: quest.xp_value,
          })

          // Log activity
          await logActivity("quest_completed", { quest_name: quest.name, quest_id: quest.id }, quest.xp_value)

          const { data: existingLog } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", userId)
            .eq("log_date", today)
            .maybeSingle()

          if (existingLog) {
            await supabase
              .from("daily_logs")
              .update({
                total_xp: existingLog.total_xp + quest.xp_value,
                quests_completed: existingLog.quests_completed + 1,
              })
              .eq("id", existingLog.id)
          } else {
            await supabase.from("daily_logs").insert({
              user_id: userId,
              log_date: today,
              total_xp: quest.xp_value,
              quests_completed: 1,
            })
          }

          if (profile) {
            const newTotalXP = Math.max(0, profile.total_xp + quest.xp_value)
            const newLevel = Math.floor(newTotalXP / 500) + 1

            if (newLevel > profile.level && quest.xp_value > 0) {
              setTimeout(() => {
                playSound("levelup")
                setLevelUp({ level: newLevel, visible: true })
              }, 1200)
              // Log level up
              await logActivity("level_up", { new_level: newLevel, old_level: profile.level }, 0)
            }

            await supabase
              .from("profiles")
              .update({
                total_xp: newTotalXP,
                level: newLevel,
                last_active_date: today,
              })
              .eq("id", userId)
          }
        }

        setCompletedQuests(new Set([...completedQuests, quest.id]))
      } else {
        playSound("click")
        if (supabase) {
          await supabase
            .from("quest_completions")
            .delete()
            .eq("user_id", userId)
            .eq("quest_id", quest.id)
            .eq("completion_date", today)

          // Log undo
          await logActivity("quest_unchecked", { quest_name: quest.name, quest_id: quest.id }, -quest.xp_value)

          const { data: existingLog } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", userId)
            .eq("log_date", today)
            .maybeSingle()

          if (existingLog) {
            await supabase
              .from("daily_logs")
              .update({
                total_xp: existingLog.total_xp - quest.xp_value,
                quests_completed: Math.max(0, existingLog.quests_completed - 1),
              })
              .eq("id", existingLog.id)
          }

          if (profile) {
            await supabase
              .from("profiles")
              .update({ total_xp: profile.total_xp - quest.xp_value })
              .eq("id", userId)
          }
        }

        const newSet = new Set(completedQuests)
        newSet.delete(quest.id)
        setCompletedQuests(newSet)
      }

      router.refresh()
    } catch (error) {
      console.error("Error toggling quest:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleApplyPenalty = async () => {
    const penaltyQuest = quests.find((q) => q.xp_value < 0)
    if (penaltyQuest && !completedQuests.has(penaltyQuest.id)) {
      await handleToggleQuest(penaltyQuest, true)
    }
  }

  const handleResetDaily = async () => {
    playSound("click")
    const today = new Date().toISOString().split("T")[0]

    if (supabase) {
      await supabase.from("quest_completions").delete().eq("user_id", userId).eq("completion_date", today)
      await supabase.from("daily_logs").delete().eq("user_id", userId).eq("log_date", today)
      await logActivity("daily_reset", { date: today }, 0)
    }

    setCompletedQuests(new Set())
    if (!isDemo) router.refresh()
  }

  // Year calculations
  const now = new Date()
  const currentYear = now.getFullYear()
  const yearStart = new Date(currentYear, 0, 1)
  const yearEnd = new Date(currentYear, 11, 31)
  const daysPassed = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalDaysInYear = Math.floor((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysRemaining = totalDaysInYear - daysPassed

  const logMap = new Map(yearLogs.map((log) => [log.log_date, log]))
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

  const yearDays = Array.from({ length: totalDaysInYear }, (_, i) => {
    const date = new Date(yearStart)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]
    const log = logMap.get(dateStr)
    const isPast = date <= now
    const isToday = dateStr === new Date().toISOString().split("T")[0]

    let status: "none" | "fail" | "pass" | "elite" = "none"
    if (isPast && log) {
      if (log.total_xp >= 100) status = "elite"
      else if (log.total_xp >= xpGoal) status = "pass"
      else if (log.total_xp > 0) status = "fail"
    }

    return { date: dateStr, isPast, isToday, status, xp: log?.total_xp || 0, month: date.getMonth() }
  })

  const goalsAchievedCount = yearLogs.filter((log) => log.total_xp >= xpGoal).length
  const positiveQuests = quests.filter((q) => q.xp_value > 0)
  const penaltyQuest = quests.find((q) => q.xp_value < 0)

  return (
    <div className="min-h-screen cyber-bg text-white">
      <Confetti isActive={showConfetti} />
      <XPPopup xp={xpPopup.xp} isVisible={xpPopup.visible} isNegative={xpPopup.isNegative} />
      <NeutralBurst isActive={showNeutralBurst} />
      <LevelUpOverlay level={levelUp.level} isVisible={levelUp.visible} onClose={handleCloseLevelUp} />
      <GoalAchievedOverlay isVisible={goalAchieved} onClose={handleCloseGoal} />

      <div className="fixed inset-0 pointer-events-none scanlines z-40 opacity-30" />

      <header className="relative border-b border-cyan-900/50 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white cyber-text">THE XP SYSTEM</h1>
            <p className="text-cyan-500 text-xs md:text-sm tracking-widest">GAMIFY YOUR DAY • DAILY GOAL: 70+ XP</p>
            {isDemo && (
              <span className="inline-flex items-center gap-2 mt-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 text-[11px] font-mono">
                DEMO MODE (no cloud sync)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors"
            >
              {muted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>
            <Link href="/analytics" className="cyber-button-secondary px-3 py-2 text-sm">
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">ANALYTICS</span>
            </Link>
            <Link href="/leaderboard" className="cyber-button-secondary px-3 py-2 text-sm">
              <Trophy className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">LEADERBOARD</span>
            </Link>
            <Link href="/settings" className="cyber-button-secondary px-3 py-2 text-sm">
              <Zap className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">SETTINGS</span>
            </Link>
            <Link href="/docs" className="cyber-button-secondary px-3 py-2 text-sm">
              <BookOpen className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">API</span>
            </Link>
            {!isDemo && (
              <Link href="/auth/logout" className="cyber-button-secondary px-3 py-2 text-sm text-red-400 border-red-500/30 hover:border-red-500">
                LOGOUT
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 mb-8">
          <div className="cyber-card p-6 text-center">
            <p className="text-slate-500 text-xs tracking-widest mb-2">CURRENT XP</p>
            <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-cyan-400 font-bold tracking-wider">{rank}</p>
            <p className="text-3xl font-black text-white mt-1">{profile?.total_xp || 0}</p>
          </div>

          <div className="cyber-card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
              <div>
                <p className="text-slate-500 text-xs tracking-widest">DAILY PROGRESS</p>
                <p className={`text-2xl font-black ${status.color}`}>{status.text}</p>
              </div>
              <div className="text-right">
                <span className="text-white font-mono">{Math.max(0, xpGoal - dailyXP)} XP to Clear</span>
              </div>
            </div>

            <div className="relative h-6 bg-slate-800 rounded overflow-hidden border border-slate-700">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  dailyXP >= xpGoal
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                    : dailyXP >= xpGoal * 0.7
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-400"
                      : dailyXP >= xpGoal * 0.4
                        ? "bg-gradient-to-r from-amber-600 to-amber-400"
                        : "bg-gradient-to-r from-red-600 to-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg tracking-wider">
                  {dailyXP >= xpGoal ? "SYNCING 100%" : `SYNCING ${Math.round(progressPercent)}%`}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-600 mt-2 font-mono">
              <span>BASELINE</span>
              <span>70 XP (PASS)</span>
              <span>100+ XP (ELITE)</span>
            </div>
          </div>
        </div>

        {/* Yearly Mastery Log */}
        <div className="cyber-card p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold tracking-wider text-white">YEARLY MASTERY LOG</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-700" />
                <span className="text-slate-500">NONE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-slate-500">FAIL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-slate-500">PASS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-cyan-400" />
                <span className="text-slate-500">ELITE</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-between text-xs text-slate-600 mb-2 px-1">
            {months.map((m) => (
              <span key={m} className="w-[calc(100%/12)] text-center">
                {m}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(53,1fr)] gap-[2px] overflow-x-auto">
            {Array.from({ length: 7 }).map((_, dayOfWeek) => (
              <div key={dayOfWeek} className="contents">
                {Array.from({ length: 53 }).map((_, week) => {
                  const dayIndex = week * 7 + dayOfWeek
                  const day = yearDays[dayIndex]
                  if (!day) return <div key={`${week}-${dayOfWeek}`} className="aspect-square" />

                  let bgColor = "bg-slate-800/50"
                  if (day.isPast) {
                    if (day.status === "elite") bgColor = "bg-cyan-400"
                    else if (day.status === "pass") bgColor = "bg-emerald-500"
                    else if (day.status === "fail") bgColor = "bg-red-500/70"
                    else bgColor = "bg-slate-700/50"
                  }

                  return (
                    <div
                      key={`${week}-${dayOfWeek}`}
                      className={`aspect-square rounded-sm ${bgColor} ${
                        day.isToday ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900" : ""
                      } hover:scale-150 hover:z-10 transition-transform cursor-pointer`}
                      title={`${day.date}: ${day.xp} XP`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-4">
            <p className="text-slate-600 text-xs">Historical data logged automatically. Commit your day to update.</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-slate-500">
                <span className="text-cyan-400 font-bold">{daysPassed}</span> passed
              </span>
              <span className="text-slate-500">
                <span className="text-emerald-400 font-bold">{goalsAchievedCount}</span> achieved
              </span>
              <span className="text-slate-500">
                <span className="text-slate-400 font-bold">{daysRemaining}</span> remaining
              </span>
            </div>
          </div>
        </div>

        {/* Active Quests - Tickable */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold tracking-wider text-white">ACTIVE QUESTS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {positiveQuests.map((quest, index) => {
              const isCompleted = completedQuests.has(quest.id)
              const IconComponent = questIcons[quest.name] || Zap

              return (
                <button
                  key={quest.id}
                  onClick={() => handleToggleQuest(quest, !isCompleted)}
                  disabled={isLoading === quest.id}
                  className={`quest-card group ${isCompleted ? "quest-card-completed opacity-50 grayscale-[0.5]" : ""}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-800 text-slate-500"}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${isCompleted ? "text-cyan-400" : "text-white"}`}>
                        {quest.name.toUpperCase()}
                      </p>
                      <p className={`text-xs ${isCompleted ? "text-cyan-500" : "text-cyan-500"}`}>
                        +{quest.xp_value} XP
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isCompleted ? "bg-cyan-500 border-cyan-400" : "border-slate-600 group-hover:border-cyan-500"}`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                    {isLoading === quest.id && (
                      <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hazard Zone */}
        {penaltyQuest && (
          <div className="cyber-card-danger p-4 md:p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-red-500 font-bold tracking-wider">HAZARD ZONE</h2>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-white font-bold">{penaltyQuest.name}</p>
                  <p className="text-slate-500 text-sm">Major setback to physical and mental momentum.</p>
                </div>
              </div>
              <button
                onClick={handleApplyPenalty}
                disabled={completedQuests.has(penaltyQuest.id) || isLoading === penaltyQuest.id}
                className={`cyber-button-danger ${completedQuests.has(penaltyQuest.id) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {completedQuests.has(penaltyQuest.id) ? "PENALTY APPLIED" : `${penaltyQuest.xp_value} XP PENALTY`}
              </button>
            </div>
          </div>
        )}

        {/* The Fuel Plan */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold tracking-wider text-white">THE FUEL PLAN</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="cyber-card p-4 text-center">
              <p className="text-slate-500 text-xs tracking-widest mb-1">TARGET CALORIES</p>
              <p className="text-2xl font-bold text-cyan-400">2,750</p>
              <p className="text-slate-600 text-xs">kcal</p>
            </div>
            <div className="cyber-card p-4 text-center">
              <p className="text-slate-500 text-xs tracking-widest mb-1">TARGET PROTEIN</p>
              <p className="text-2xl font-bold text-emerald-400">160</p>
              <p className="text-slate-600 text-xs">grams</p>
            </div>
            <div className="cyber-card p-4 text-center">
              <p className="text-slate-500 text-xs tracking-widest mb-1">TARGET HYDRATION</p>
              <p className="text-2xl font-bold text-blue-400">3.5</p>
              <p className="text-slate-600 text-xs">liters</p>
            </div>
            <div className="cyber-card p-4 text-center">
              <p className="text-slate-500 text-xs tracking-widest mb-1">DEEP WORK</p>
              <p className="text-2xl font-bold text-amber-400">4</p>
              <p className="text-slate-600 text-xs">hours</p>
            </div>
          </div>
        </div>

        {/* Deep Coding Tracker */}
        <div className="mb-8">
          <DeepCodingTimer
            onComplete={() => {
              const codingQuest = quests.find((q) => q.name.includes("Coding"))
              if (codingQuest && !completedQuests.has(codingQuest.id)) {
                handleToggleQuest(codingQuest, true)
              }
            }}
            playSound={playSound}
            userId={userId}
            initialSeconds={initialTimerSeconds}
            isDemo={isDemo}
          />
        </div>

        {/* Journal / Mood / Energy */}
        <div className="cyber-card p-4 md:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold tracking-wider text-white">DAILY JOURNAL</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-500 text-xs tracking-widest mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" /> MOOD
              </label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMood(v)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                      mood === v
                        ? "bg-pink-500/30 border-pink-400 text-pink-300"
                        : "border-slate-700 text-slate-500 hover:border-pink-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-500 text-xs tracking-widest mb-2 flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" /> ENERGY
              </label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergy(v)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                      energy === v
                        ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                        : "border-slate-700 text-slate-500 hover:border-emerald-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Reflect on today... (optional)"
            className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={saveJournal}
              disabled={journalSaving || isDemo}
              className="cyber-button-secondary px-4 py-2 text-xs tracking-widest"
            >
              {journalSaving ? "SAVING..." : "SAVE JOURNAL"}
            </button>
          </div>
        </div>

        {/* Streak & Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="cyber-card p-4 text-center">
            <Flame className="w-6 h-6 mx-auto text-orange-400 mb-1" />
            <p className="text-slate-500 text-xs tracking-widest">CURRENT STREAK</p>
            <p className="text-2xl font-bold text-orange-400">{(profile as any)?.current_streak || 0}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
            <p className="text-slate-500 text-xs tracking-widest">LONGEST STREAK</p>
            <p className="text-2xl font-bold text-cyan-400">{(profile as any)?.longest_streak || 0}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <Award className="w-6 h-6 mx-auto text-amber-400 mb-1" />
            <p className="text-slate-500 text-xs tracking-widest">LEVEL</p>
            <p className="text-2xl font-bold text-amber-400">{profile?.level || 1}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
            <p className="text-slate-500 text-xs tracking-widest">TOTAL XP</p>
            <p className="text-2xl font-bold text-emerald-400">{profile?.total_xp || 0}</p>
          </div>
        </div>

        {/* Reset Button */}
        <div className="text-center">
          <button onClick={handleResetDaily} className="cyber-button-secondary px-6 py-3 text-sm tracking-widest">
            <RotateCcw className="w-4 h-4 mr-2" />
            RESET DAILY SYSTEM
          </button>
        </div>
      </main>
    </div>
  )
}
