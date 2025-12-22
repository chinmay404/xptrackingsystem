export interface Quest {
  id: string
  name: string
  xp_value: number
  category: string
  description?: string
  icon?: string
  sort_order: number
}

export interface QuestCompletion {
  id: string
  user_id: string
  quest_id: string
  completed_at: string
  completion_date: string
  xp_earned: number
}

export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  total_xp: number
  quests_completed: number
}

export interface Profile {
  id: string
  username: string
  email?: string
  total_xp: number
  level: number
  streak_days: number
  last_active_date?: string
  created_at: string
}

export interface TimerSession {
  id: string
  user_id: string
  session_date: string
  duration_seconds: number
  started_at?: string
  ended_at?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action_type: string
  action_details?: Record<string, any>
  xp_change: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  notification_type: string
  sent_at?: string
  scheduled_for?: string
  email_content?: Record<string, any>
  status: string
  created_at: string
}

export const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"
