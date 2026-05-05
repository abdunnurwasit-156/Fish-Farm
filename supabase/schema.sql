-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Ponds
create table ponds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  area_m2 numeric not null,
  depth_m numeric not null,
  water_source text,
  location_lat numeric,
  location_lng numeric,
  location_name text,
  created_at timestamptz default now()
);

-- Fish stocks
create table fish_stocks (
  id uuid primary key default uuid_generate_v4(),
  pond_id uuid references ponds(id) on delete cascade not null,
  species text not null,
  initial_count integer not null,
  current_count integer not null,
  avg_weight_kg numeric not null,
  release_date date not null,
  feed_rate_pct numeric not null default 3.0,
  fasting_day integer not null default 3, -- 0=Sun, 1=Mon ... 6=Sat
  created_at timestamptz default now()
);

-- Weight updates (every 15 days)
create table weight_updates (
  id uuid primary key default uuid_generate_v4(),
  fish_stock_id uuid references fish_stocks(id) on delete cascade not null,
  avg_weight_kg numeric not null,
  recorded_at timestamptz default now()
);

-- Custom meals / feed types
create table meals (
  id uuid primary key default uuid_generate_v4(),
  pond_id uuid references ponds(id) on delete cascade not null,
  name text not null,
  pellet_size text,
  brand text,
  protein_pct numeric,
  notes text,
  created_at timestamptz default now()
);

-- Daily feed logs
create table feed_logs (
  id uuid primary key default uuid_generate_v4(),
  fish_stock_id uuid references fish_stocks(id) on delete cascade not null,
  meal_id uuid references meals(id),
  session text not null check (session in ('morning', 'afternoon')),
  recommended_kg numeric not null,
  actual_kg numeric,
  is_fasting_day boolean default false,
  logged_at timestamptz default now()
);

-- Mortality logs
create table mortality_logs (
  id uuid primary key default uuid_generate_v4(),
  fish_stock_id uuid references fish_stocks(id) on delete cascade not null,
  count integer not null,
  cause text,
  notes text,
  logged_at timestamptz default now()
);

-- Water quality logs
create table water_quality_logs (
  id uuid primary key default uuid_generate_v4(),
  pond_id uuid references ponds(id) on delete cascade not null,
  ph numeric,
  dissolved_oxygen_mg numeric,
  ammonia_mg numeric,
  temperature_c numeric,
  turbidity text,
  notes text,
  logged_at timestamptz default now()
);

-- Alerts
create table alerts (
  id uuid primary key default uuid_generate_v4(),
  pond_id uuid references ponds(id) on delete cascade not null,
  type text not null, -- 'weather', 'ammonia', 'mortality', 'weight_update', 'fasting', 'water_quality'
  severity text not null default 'info' check (severity in ('info', 'warning', 'danger')),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table ponds enable row level security;
alter table fish_stocks enable row level security;
alter table weight_updates enable row level security;
alter table meals enable row level security;
alter table feed_logs enable row level security;
alter table mortality_logs enable row level security;
alter table water_quality_logs enable row level security;
alter table alerts enable row level security;

create policy "Users manage own ponds" on ponds for all using (auth.uid() = user_id);
create policy "Users manage own fish_stocks" on fish_stocks for all using (
  pond_id in (select id from ponds where user_id = auth.uid())
);
create policy "Users manage own weight_updates" on weight_updates for all using (
  fish_stock_id in (select fs.id from fish_stocks fs join ponds p on p.id = fs.pond_id where p.user_id = auth.uid())
);
create policy "Users manage own meals" on meals for all using (
  pond_id in (select id from ponds where user_id = auth.uid())
);
create policy "Users manage own feed_logs" on feed_logs for all using (
  fish_stock_id in (select fs.id from fish_stocks fs join ponds p on p.id = fs.pond_id where p.user_id = auth.uid())
);
create policy "Users manage own mortality_logs" on mortality_logs for all using (
  fish_stock_id in (select fs.id from fish_stocks fs join ponds p on p.id = fs.pond_id where p.user_id = auth.uid())
);
create policy "Users manage own water_quality" on water_quality_logs for all using (
  pond_id in (select id from ponds where user_id = auth.uid())
);
create policy "Users manage own alerts" on alerts for all using (
  pond_id in (select id from ponds where user_id = auth.uid())
);

-- AI Chat history
create table ai_chats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pond_id uuid references ponds(id) on delete set null,
  title text not null default 'নতুন কথোপকথন',
  mode text not null default 'chat',
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ai_chats enable row level security;

create policy "Users manage own ai_chats" on ai_chats
  for all using (auth.uid() = user_id);
