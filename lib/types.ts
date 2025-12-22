export interface Quest {
  id: string
  name: string
  xp_value: number
  category: string
  description?: string
  icon?: string
  sort_order: number
  user_id?: string
  is_global?: boolean
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
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
  current_streak?: number
  longest_streak?: number
  last_pass_date?: string
  target_calories?: number
  target_protein?: number
  target_hydration?: number
  target_deep_work?: number
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

export interface Achievement {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  xp_reward: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string
  content?: string
  mood?: number
  energy?: number
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_value: number
  current_value: number
  unit: string
  deadline?: string
  status: 'active' | 'completed' | 'failed' | 'paused'
  created_at: string
  completed_at?: string
}

export const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001"
