-- House of Joshi — Supabase schema
-- Matches lib/types.ts. Safe to run even if some of this already exists.
-- Run in: Supabase Dashboard -> SQL Editor -> New query

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  username text,
  bio text,
  avatar_url text,
  banner_url text,
  twitter_handle text,
  farcaster_handle text,
  website_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  contract_address text unique,
  creator_id uuid references users(id) on delete set null,
  name text not null,
  symbol text not null,
  description text,
  banner_url text,
  cover_image_url text,
  logo_url text,
  featured_image_url text,
  external_url text,
  twitter_url text,
  discord_url text,
  base_uri text,
  max_supply integer not null default 0,
  mint_price_eth numeric not null default 0,
  mint_price_wei text,
  mint_start_time timestamptz,
  mint_end_time timestamptz,
  royalty_percentage numeric default 0,
  royalty_recipient text,
  is_verified boolean default false,
  is_featured boolean default false,
  is_trending boolean default false,
  is_public boolean default true,
  status text default 'draft' check (status in
    ('draft','generating','uploading','deploying','verifying','live','paused','ended')),
  deployment_tx_hash text,
  verification_tx_hash text,
  ipfs_images_cid text,
  ipfs_metadata_cid text,
  total_unique_traits integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deployed_at timestamptz,
  verified_at timestamptz
);

create index if not exists idx_collections_creator on collections(creator_id);
create index if not exists idx_collections_contract on collections(contract_address);
create index if not exists idx_collections_public on collections(is_public, status);

create table if not exists layers (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  is_required boolean default true,
  created_at timestamptz default now()
);

create table if not exists traits (
  id uuid primary key default uuid_generate_v4(),
  layer_id uuid references layers(id) on delete cascade,
  name text not null,
  image_url text,
  ipfs_cid text,
  rarity_weight numeric default 1,
  is_unique boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists nfts (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  token_id integer,
  dna text not null,
  name text,
  description text,
  image_url text,
  ipfs_image_cid text,
  metadata_url text,
  ipfs_metadata_cid text,
  attributes jsonb default '[]'::jsonb,
  rarity_rank integer,
  rarity_score numeric,
  is_minted boolean default false,
  minter_address text,
  minted_at timestamptz,
  mint_tx_hash text,
  created_at timestamptz default now()
);

create table if not exists mint_transactions (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  nft_id uuid references nfts(id) on delete set null,
  wallet_address text not null,
  token_id integer,
  quantity integer default 1,
  tx_hash text,
  amount_eth numeric,
  amount_wei text,
  status text default 'pending' check (status in ('pending','confirmed','failed','refunded')),
  referral_wallet text,
  estimated_gas text,
  created_at timestamptz default now(),
  confirmed_at timestamptz
);

create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  wallet_address text,
  referral_wallet text,
  created_at timestamptz default now()
);

-- Row Level Security -------------------------------------------------------

alter table users enable row level security;
alter table collections enable row level security;
alter table layers enable row level security;
alter table traits enable row level security;
alter table nfts enable row level security;
alter table mint_transactions enable row level security;
alter table analytics_events enable row level security;

-- Anyone can read public profile info; anyone can create/update their own user row.
-- (Wallet-based auth isn't Supabase Auth here, so writes are scoped app-side —
-- tighten this further if you add real auth.)
drop policy if exists "users are publicly readable" on users;
create policy "users are publicly readable" on users for select using (true);

drop policy if exists "anyone can insert a user row" on users;
create policy "anyone can insert a user row" on users for insert with check (true);

drop policy if exists "anyone can update a user row" on users;
create policy "anyone can update a user row" on users for update using (true);

-- Collections: public collections are readable by everyone; anyone can insert
-- (deploy flow) and update (dashboard edit / verification callback) for now.
drop policy if exists "public collections are readable" on collections;
create policy "public collections are readable" on collections
  for select using (is_public = true);

drop policy if exists "anyone can insert a collection" on collections;
create policy "anyone can insert a collection" on collections
  for insert with check (true);

drop policy if exists "anyone can update a collection" on collections;
create policy "anyone can update a collection" on collections
  for update using (true);

-- Layers/traits/nfts follow their parent collection's public visibility.
drop policy if exists "layers readable via public collection" on layers;
create policy "layers readable via public collection" on layers
  for select using (
    exists (select 1 from collections c where c.id = layers.collection_id and c.is_public = true)
  );
drop policy if exists "anyone can write layers" on layers;
create policy "anyone can write layers" on layers for all using (true) with check (true);

drop policy if exists "traits readable via public collection" on traits;
create policy "traits readable via public collection" on traits
  for select using (
    exists (
      select 1 from layers l
      join collections c on c.id = l.collection_id
      where l.id = traits.layer_id and c.is_public = true
    )
  );
drop policy if exists "anyone can write traits" on traits;
create policy "anyone can write traits" on traits for all using (true) with check (true);

drop policy if exists "nfts readable via public collection" on nfts;
create policy "nfts readable via public collection" on nfts
  for select using (
    exists (select 1 from collections c where c.id = nfts.collection_id and c.is_public = true)
  );
drop policy if exists "anyone can write nfts" on nfts;
create policy "anyone can write nfts" on nfts for all using (true) with check (true);

drop policy if exists "anyone can write mint transactions" on mint_transactions;
create policy "anyone can write mint transactions" on mint_transactions for all using (true) with check (true);

drop policy if exists "anyone can write analytics" on analytics_events;
create policy "anyone can write analytics" on analytics_events for all using (true) with check (true);
