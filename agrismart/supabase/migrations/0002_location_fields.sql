-- 0002 — location fields for every location-enabled record (Google Maps spec §17)
--
-- Adds the shared location block to each table that appears on a map:
--   latitude, longitude, address, city, district, state, postal_code
-- The demo dataset in lib/places.ts mirrors this shape exactly, so switching
-- from sample data to live queries is a drop-in change.

-- farms ---------------------------------------------------------------------
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  acres numeric(8,2),
  soil text,
  irrigation text,
  crop text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  created_at timestamptz not null default now()
);

-- machinery (AgriRent listings) ---------------------------------------------
alter table if exists public.machinery
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists state text default 'Andhra Pradesh',
  add column if not exists postal_code text,
  add column if not exists service_radius_km numeric(6,1);

create table if not exists public.machinery (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references auth.users (id) on delete cascade,
  name text not null,
  hourly_rate numeric(10,2),
  daily_rate numeric(10,2),
  available boolean not null default true,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  service_radius_km numeric(6,1),
  created_at timestamptz not null default now()
);

-- marketplace listings -------------------------------------------------------
alter table if exists public.marketplace_listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists state text default 'Andhra Pradesh',
  add column if not exists postal_code text;

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  price numeric(12,2) not null,
  unit text not null,
  quantity text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  created_at timestamptz not null default now()
);

-- experts ---------------------------------------------------------------------
alter table if exists public.experts
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists state text default 'Andhra Pradesh',
  add column if not exists postal_code text;

create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  field text not null,
  speciality text,
  consult_fee numeric(10,2),
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  created_at timestamptz not null default now()
);

-- markets (market yards) -------------------------------------------------------
create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  open_hours text,
  created_at timestamptz not null default now()
);

-- service providers (vet, input stores, aqua/poultry/dairy services, storage) --
create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  category text not null,           -- vet | inputs | aqua | poultry | dairy | storage | machinery
  name text not null,
  phone text,
  open_hours text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  service_radius_km numeric(6,1),
  created_at timestamptz not null default now()
);

-- government services (agri offices, RBKs, labs, service centres) --------------
create table if not exists public.government_services (
  id uuid primary key default gen_random_uuid(),
  kind text not null,               -- office | lab | service_centre | storage
  name text not null,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  district text,
  state text default 'Andhra Pradesh',
  postal_code text,
  open_hours text,
  created_at timestamptz not null default now()
);

-- radius / nearest-neighbour lookups ------------------------------------------
create index if not exists farms_loc_idx              on public.farms (latitude, longitude);
create index if not exists machinery_loc_idx          on public.machinery (latitude, longitude);
create index if not exists marketplace_listings_loc_idx on public.marketplace_listings (latitude, longitude);
create index if not exists experts_loc_idx            on public.experts (latitude, longitude);
create index if not exists markets_loc_idx            on public.markets (latitude, longitude);
create index if not exists service_providers_loc_idx  on public.service_providers (latitude, longitude);
create index if not exists government_services_loc_idx on public.government_services (latitude, longitude);
