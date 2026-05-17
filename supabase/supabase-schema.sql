-- ============================================
-- APU Room Booking System — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable the btree_gist extension FIRST (required for the overlap check)
create extension if not exists btree_gist;

-- Bookings table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz default now() not null
);

-- Overlap prevention via trigger (avoids btree_gist text operator class issue)
create or replace function check_booking_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from public.bookings
    where room_id = NEW.room_id
      and date = NEW.date
      and status = 'confirmed'
      and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and start_time < NEW.end_time
      and end_time > NEW.start_time
  ) then
    raise exception 'no_overlap: This time slot conflicts with an existing booking.';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_no_overlap
  before insert or update on public.bookings
  for each row execute function check_booking_overlap();

-- Row Level Security
alter table public.bookings enable row level security;

create policy "Anyone can view confirmed bookings"
  on public.bookings for select
  using (true);

create policy "Users can create their own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

-- Real-time
alter publication supabase_realtime add table public.bookings;

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

update public.profiles 
set is_admin = true 
where id = (select id from auth.users where email = 'xmohammadaminx99@gmail.com');