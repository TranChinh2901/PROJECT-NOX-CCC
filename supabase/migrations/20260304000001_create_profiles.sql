-- Migration: 001_create_profiles
-- Creates the profiles table linked to Supabase auth.users.
-- The profiles table stores auth-adjacent data for each authenticated user.
-- legacy_user_id bridges Supabase UUID identity to the existing numeric MySQL user id.

create table if not exists public.profiles (
  id                uuid        primary key references auth.users (id) on delete cascade,
  legacy_user_id    bigint      unique,
  fullname          text        not null default '',
  phone_number      text,
  address           text,
  gender            text        check (gender in ('male', 'female')),
  date_of_birth     date,
  avatar_url        text,
  role              text        not null default 'USER' check (role in ('ADMIN', 'USER')),
  is_verified       boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists profiles_legacy_user_id_idx on public.profiles (legacy_user_id);
create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_profiles_updated_at();
