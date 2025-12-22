-- Create a default profile for personal use
-- This ensures the app works without authentication

INSERT INTO profiles (id, total_xp, level, streak_days, last_active_date)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  0,
  1,
  0,
  CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;
