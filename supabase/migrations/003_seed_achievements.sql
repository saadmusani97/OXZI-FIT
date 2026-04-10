-- 003_seed_achievements.sql
-- OXZIFIT: Seed achievements catalog

INSERT INTO achievements (name, description, requirement_type, requirement_value, points_reward, icon) VALUES
  ('First Steps',       'Log your first workout',          'workouts_count',  1,      10,  '🏋️'),
  ('Road Warrior',      'Complete your first route',       'routes_count',    1,      10,  '🛣️'),
  ('Food Scanner',      'Scan your first meal',            'meals_count',     1,      10,  '📷'),
  ('Week Warrior',      'Maintain a 7-day streak',         'streak_days',     7,      50,  '🔥'),
  ('Monthly Champion',  'Maintain a 30-day streak',        'streak_days',     30,     200, '🏆'),
  ('Step Master',       'Walk 10,000 steps in a day',      'daily_steps',     10000,  25,  '👟'),
  ('Century Steps',     'Walk 100,000 total steps',        'total_steps',     100000, 100, '💯'),
  ('Explorer',          'Complete 10 routes',              'routes_count',    10,     75,  '🗺️'),
  ('Nutrition Nerd',    'Log 50 meals',                    'meals_count',     50,     50,  '🥗'),
  ('Iron Will',         'Complete 50 workouts',            'workouts_count',  50,     150, '💪');
