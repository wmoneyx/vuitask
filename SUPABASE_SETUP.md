# Supabase Database Setup

Please run the following SQL commands in your Supabase SQL Editor to set up the necessary tables for the application.

```sql
-- 0. Enable UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_uuid TEXT PRIMARY KEY,
  user_email TEXT,
  user_name TEXT,
  vui_coin_balance BIGINT DEFAULT 0,
  coin_task_balance BIGINT DEFAULT 0,
  today_balance BIGINT DEFAULT 0,
  today_turns INT DEFAULT 0,
  monthly_balance BIGINT DEFAULT 0,
  last_attendance DATE,
  last_reset_day DATE DEFAULT CURRENT_DATE,
  last_reset_month DATE DEFAULT CURRENT_DATE,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  task_bonus_percent INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration for existing users (Run if columns are missing):
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS task_bonus_percent INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS today_balance BIGINT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS today_turns INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_balance BIGINT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_day DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_month DATE DEFAULT CURRENT_DATE;

-- Note: In case the table already exists, migrate to user_uuid as PK if needed
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
-- ALTER TABLE public.profiles ADD PRIMARY KEY (user_uuid);
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;

-- 2. Tasks Registry
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'shortlink', -- 'shortlink', 'review', 'gmail'
  reward BIGINT NOT NULL,
  auto BOOLEAN DEFAULT false,
  api_url TEXT,
  tutorial_url TEXT,
  max_views INT DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tasks History Table
CREATE TABLE IF NOT EXISTS public.tasks_history (
  id TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_id TEXT,
  url TEXT,
  reward BIGINT NOT NULL,
  status TEXT NOT NULL, -- 'Hoàn thành', 'Chờ duyệt', 'Từ chối'
  status_v1 TEXT,
  status_v2 TEXT,
  ip TEXT,
  fingerprint TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thêm cột nếu chưa có (Migration)
ALTER TABLE public.tasks_history ADD COLUMN IF NOT EXISTS task_id TEXT;
ALTER TABLE public.tasks_history ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- 4. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  reward INT NOT NULL,
  auto BOOLEAN DEFAULT false,
  expires BIGINT NOT NULL,
  completed BOOLEAN DEFAULT false,
  short_url TEXT,
  fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- 5. Community Messages Table
CREATE TABLE IF NOT EXISTS public.community_messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'withdrawal', 'message', 'reply', 'task_review'
  user_name TEXT,
  user_avatar TEXT,
  user_uuid TEXT,
  is_admin BOOLEAN DEFAULT false,
  content TEXT,
  amount BIGINT,
  status TEXT, -- 'Đang chờ duyệt', 'Đã thanh toán'
  timestamp BIGINT NOT NULL,
  reply_to_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_uuid TEXT NOT NULL,
  user_name TEXT,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_uuid, emoji)
);

-- 7. Site Notifications Table
CREATE TABLE IF NOT EXISTS public.site_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT, -- 'info', 'warning', 'success', 'error'
  target TEXT, -- 'admin', 'user', 'all'
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Gift Codes Table
CREATE TABLE IF NOT EXISTS public.gift_codes (
  code TEXT PRIMARY KEY,
  reward_amount BIGINT DEFAULT 0,
  reward_type TEXT DEFAULT 'vui_coin', -- 'vui_coin', 'coin_task'
  bonus_percent INT DEFAULT 0,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gift_codes ADD COLUMN IF NOT EXISTS bonus_percent INT DEFAULT 0;

-- 9. Attendance Logs
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  day_count INT NOT NULL, -- Strike day
  reward BIGINT NOT NULL,
  timestamp DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Data for Tasks
INSERT INTO public.tasks (id, name, type, reward, auto, api_url, max_views, tutorial_url) VALUES
('layma', 'LAYMA', 'shortlink', 600, true, 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=', 2, NULL),
('link4m', 'LINK4M', 'shortlink', 300, true, 'https://link4m.co/api-shorten/v2?api=68208afab6b8fc60542289b6&url=', 2, NULL),
('utl_3step', 'UTL 3 STEP', 'shortlink', 463, true, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=3&url=', 999, NULL),
('utl_2step', 'UTL 2 STEP', 'shortlink', 449, true, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=', 999, NULL),
('utl_1step', 'UTL 1 STEP', 'shortlink', 385, true, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', 999, NULL),
('traffic68', 'TRAFFIC68', 'shortlink', 449, true, 'https://traffic68.com/api/quicklink/api?api=tf68_c42992fb620964a590a36f35a0412f70bab3236f1e0aeb08&url=', 4, NULL),
('linktot', 'LINKTOT', 'shortlink', 400, true, 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 4, NULL),
('timmap', 'TIMMAP', 'shortlink', 200, true, 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 2, NULL),
('bbmkts', 'BBMKTS', 'shortlink', 300, true, 'https://bbmkts.com/dapi?token=d285ce6c761cc5961316783a&longurl=', 1, NULL),
('linkngon', 'LINKNGON', 'shortlink', 250, true, 'https://linkngon.top/api?api=iDqggiRIz7r9280v8NsD8jZS&url=', 2, NULL),
('linktop', 'LINKTOP', 'shortlink', 150, true, 'https://linktop.one/api?api=tXbluP65U5e2IuzTqVOFjAcLfJvGrzgcoaAFEnFqTbG5AG&url=', 2, NULL),
('traffictop', 'TRAFFICTOP', 'shortlink', 200, true, 'https://traffictop.net/api?api=OrKX4KckO50XBo29N0cCVBUW&url=', 999, NULL),
('review_map', 'Review Map', 'review', 1200, false, 'https://linktot.net/api_rv_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 10, 'https://youtube.com/shorts/MMwsAjJ9aYU?si=JSBTiReY3-HF8Bne'),
('review_trip', 'Review Trip', 'review', 2900, false, 'https://linktot.net/api_rv_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 10, 'https://youtu.be/9VuCcRuSkZM?si=ASuEXoba4fJ31E9Q')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  reward = EXCLUDED.reward,
  auto = EXCLUDED.auto,
  api_url = EXCLUDED.api_url,
  tutorial_url = EXCLUDED.tutorial_url,
  max_views = EXCLUDED.max_views;

-- 10. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Data for System Settings
INSERT INTO public.system_settings (key, value) VALUES 
('maintenance_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 11. Mod Games Table
CREATE TABLE IF NOT EXISTS public.mod_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price BIGINT NOT NULL,
  link TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_id TEXT,
  description TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Bug Reports Table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id BIGSERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. User IPs Tracking
CREATE TABLE IF NOT EXISTS public.user_ips (
  id BIGSERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_uuid, ip_address)
);

-- 15. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_uuid TEXT NOT NULL,
  referred_uuid TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reward BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(referred_uuid)
);

-- 16. Gift Code Redeems
CREATE TABLE IF NOT EXISTS public.gift_code_redeems (
  id BIGSERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  code TEXT NOT NULL,
  reward BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_uuid, code)
);

-- 17. Security RPC functions
CREATE OR REPLACE FUNCTION decrement_vui_coin(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET vui_coin_balance = vui_coin_balance - amount
  WHERE user_uuid = user_id AND vui_coin_balance >= amount;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient vui_coin_balance';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_vui_coin(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET vui_coin_balance = vui_coin_balance + amount
  WHERE user_uuid = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_coin_task(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET coin_task_balance = coin_task_balance + amount
  WHERE user_uuid = user_id;
END;
$$;
```
