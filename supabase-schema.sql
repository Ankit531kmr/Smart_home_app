-- Smart Home Dashboard schema
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status boolean not null default false,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists rooms_user_id_idx on public.rooms (user_id);
create index if not exists devices_user_id_idx on public.devices (user_id);
create index if not exists devices_room_id_idx on public.devices (room_id);

alter table public.rooms enable row level security;
alter table public.devices enable row level security;

drop policy if exists "rooms_select_own" on public.rooms;
drop policy if exists "rooms_insert_own" on public.rooms;
drop policy if exists "rooms_update_own" on public.rooms;
drop policy if exists "rooms_delete_own" on public.rooms;

drop policy if exists "devices_select_own" on public.devices;
drop policy if exists "devices_insert_own" on public.devices;
drop policy if exists "devices_update_own" on public.devices;
drop policy if exists "devices_delete_own" on public.devices;

create policy "rooms_select_own"
on public.rooms
for select
using (auth.uid() = user_id);

create policy "rooms_insert_own"
on public.rooms
for insert
with check (auth.uid() = user_id);

create policy "rooms_update_own"
on public.rooms
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "rooms_delete_own"
on public.rooms
for delete
using (auth.uid() = user_id);

create policy "devices_select_own"
on public.devices
for select
using (auth.uid() = user_id);

create policy "devices_insert_own"
on public.devices
for insert
with check (auth.uid() = user_id);

create policy "devices_update_own"
on public.devices
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "devices_delete_own"
on public.devices
for delete
using (auth.uid() = user_id);

-- Enable realtime for these tables.
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.devices;
exception
  when duplicate_object then null;
end $$;

-- Sample queries:
-- select * from public.rooms where user_id = auth.uid();
-- select * from public.devices where user_id = auth.uid();
-- insert into public.rooms (user_id, name) values (auth.uid(), 'Living Room');
-- insert into public.devices (user_id, name, status, room_id) values (auth.uid(), 'Ceiling Light', false, '<room-uuid>');
