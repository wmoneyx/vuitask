-- Supabase SQL schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

----------------------------------------------------
-- TABLES
----------------------------------------------------

-- 1. profiles
create table if not exists public.profiles (
    id uuid default uuid_generate_v4() primary key,
    user_uuid text unique not null,
    user_email text,
    user_name text,
    avatar_url text,
    vui_coin_balance numeric default 0,
    coin_task_balance numeric default 0,
    today_balance numeric default 0,
    today_turns integer default 0,
    task_bonus_percent numeric default 0,
    task_bonus_expires_at timestamptz,
    monthly_balance numeric default 0,
    is_admin boolean default false,
    is_banned boolean default false,
    last_reset_day text,
    last_reset_month text,
    created_at timestamptz default now(),
    total_tasks numeric default 0,
    total_refs integer default 0,
    last_attendance text
);

-- 2. tasks_history
create table if not exists public.tasks_history (
    id text primary key,
    user_uuid text,
    task_id text,
    reward numeric default 0,
    status text,
    status_v1 text,
    timestamp bigint
);

-- 3. community_messages
create table if not exists public.community_messages (
    id text primary key,
    type text,
    user_uuid text,
    amount numeric default 0,
    status text,
    content text,
    user_name text,
    avatar_url text,
    timestamp bigint,
    replies jsonb default '[]'::jsonb
);

-- 4. reactions
create table if not exists public.reactions (
    id uuid default uuid_generate_v4() primary key,
    message_id text,
    user_uuid text,
    user_name text,
    reaction text
);

-- 5. referrals
create table if not exists public.referrals (
    id uuid default uuid_generate_v4() primary key,
    referrer_uuid text,
    referred_uuid text,
    status text default 'pending',
    reward numeric default 0,
    timestamp bigint
);

-- 6. tasks
create table if not exists public.tasks (
    id text primary key,
    name text,
    max_views integer default 2,
    current_views integer default 0
);

-- 7. sessions
create table if not exists public.sessions (
    id text primary key,
    user_uuid text,
    task_id text,
    auto boolean default false,
    created_at timestamptz default now()
);

-- 8. site_notifications
create table if not exists public.site_notifications (
    id text primary key,
    title text,
    content text,
    type text,
    target text,
    timestamp bigint
);

-- 9. approval_history
create table if not exists public.approval_history (
    id uuid default uuid_generate_v4() primary key,
    type text,
    original_id text,
    action text,
    admin_uuid text,
    created_at timestamptz default now()
);

-- 10. activity_logs
create table if not exists public.activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_uuid text,
    action_type text,
    details text,
    created_at timestamptz default now()
);

-- 11. user_ips
create table if not exists public.user_ips (
    id uuid default uuid_generate_v4() primary key,
    user_uuid text,
    ip_address text,
    last_seen timestamptz default now(),
    unique(user_uuid, ip_address)
);

-- 12. gift_codes
create table if not exists public.gift_codes (
    code text primary key,
    reward_amount numeric default 0,
    reward_type text default 'vui_coin',
    bonus_hours numeric default 0,
    used_count integer default 0,
    created_at timestamptz default now()
);

-- 13. mod_games
create table if not exists public.mod_games (
    id text primary key,
    name text,
    description text,
    price numeric default 0,
    chestType text,
    created_at timestamptz default now()
);

-- 14. system_settings
create table if not exists public.system_settings (
    key text primary key,
    value jsonb
);

-- 15. attendance_logs
create table if not exists public.attendance_logs (
    id uuid default uuid_generate_v4() primary key,
    user_uuid text,
    day_count integer,
    reward numeric default 0,
    timestamp text
);

-- 16. gift_code_redeems
create table if not exists public.gift_code_redeems (
    id uuid default uuid_generate_v4() primary key,
    code text,
    user_uuid text,
    reward numeric,
    created_at timestamptz default now()
);

----------------------------------------------------
-- FUNCTIONS (RPCs)
----------------------------------------------------

-- Increment vui_coin_balance
CREATE OR REPLACE FUNCTION public.increment_vui_coin(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET vui_coin_balance = vui_coin_balance + amount,
      today_balance = today_balance + amount,
      monthly_balance = monthly_balance + amount
  WHERE user_uuid = user_id OR id::text = user_id;
END;
$$;

-- Decrement vui_coin_balance
CREATE OR REPLACE FUNCTION public.decrement_vui_coin(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET vui_coin_balance = vui_coin_balance - amount
  WHERE user_uuid = user_id OR id::text = user_id;
END;
$$;

-- Increment coin_task_balance
CREATE OR REPLACE FUNCTION public.increment_coin_task(user_id text, amount numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET coin_task_balance = coin_task_balance + amount
  WHERE user_uuid = user_id OR id::text = user_id;
END;
$$;
