-- 0001 — core live tables for AgriSmart 2.0 (bookings) + RLS
-- Apply in Supabase Dashboard → SQL Editor (or `supabase db push` with the
-- project DB password). Until this runs, the app stores bookings in the
-- browser and says so in the UI.

create table if not exists public.bookings (
  id text primary key,
  service text not null,
  icon text,
  provider text,
  date text,
  time text,
  status text not null default 'Pending',
  amount numeric(12,2),
  land text,
  driver boolean default false,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Signed-in farmers manage their own bookings.
create policy "owners manage own bookings"
  on public.bookings for all to authenticated
  using (owner_id = auth.uid() or owner_id is null)
  with check (owner_id = auth.uid() or owner_id is null);

-- Hackathon demo: anonymous visitors may read and insert demo bookings so the
-- flow works without login. Remove these two policies before production.
create policy "demo anon read"   on public.bookings for select to anon using (true);
create policy "demo anon insert" on public.bookings for insert to anon with check (owner_id is null);

-- Public-read bucket for crop photos (writes go through /api/farm/photo with
-- the service key, so no upload policy is needed).
insert into storage.buckets (id, name, public)
values ('crop-photos', 'crop-photos', true)
on conflict (id) do nothing;
