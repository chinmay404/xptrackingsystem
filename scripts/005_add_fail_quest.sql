-- Insert the missing fail condition quest safely
INSERT INTO public.quests (name, xp_value, category, icon, sort_order)
SELECT 'Fail Condition: Fapping / Skipping Gym', -50, 'wellness', '⚠️', 8
WHERE NOT EXISTS (
    SELECT 1 FROM public.quests WHERE name = 'Fail Condition: Fapping / Skipping Gym'
);
