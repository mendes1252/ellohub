-- ============================================================
-- Migration 002: push_subscriptions, google_calendar_tokens,
--                ASAAS fields in families
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Push subscriptions (Web Push VAPID)
create table if not exists public.push_subscriptions (
  id        uuid default gen_random_uuid() primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  endpoint  text not null,
  p256dh    text not null,
  auth_key  text not null,
  created_at timestamptz default now(),
  unique(endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "members manage own push subscriptions"
  on public.push_subscriptions for all
  using (
    member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );

-- Google Calendar OAuth tokens
create table if not exists public.google_calendar_tokens (
  id            uuid default gen_random_uuid() primary key,
  member_id     uuid not null references public.members(id) on delete cascade,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz,
  calendar_id   text default 'primary',
  synced_at     timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(member_id)
);

alter table public.google_calendar_tokens enable row level security;

create policy "members manage own google tokens"
  on public.google_calendar_tokens for all
  using (
    member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );

-- ASAAS payment fields on families
alter table public.families
  add column if not exists asaas_customer_id     text,
  add column if not exists asaas_subscription_id text;

-- events.external_id unique constraint (for Google Calendar upsert)
alter table public.events
  add column if not exists external_id text;

create unique index if not exists events_external_id_idx
  on public.events(external_id)
  where external_id is not null;
