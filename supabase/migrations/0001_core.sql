create table public.demo_profiles (
  id text primary key check (id = 'demo_user'),
  created_at timestamptz not null default now()
);

insert into public.demo_profiles (id) values ('demo_user') on conflict do nothing;

create table public.life_threads (
  id text primary key,
  demo_user_id text not null references public.demo_profiles(id),
  title text not null,
  goal_text text not null check (char_length(goal_text) between 1 and 2000),
  version integer not null check (version > 0),
  aggregate jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.thread_revisions (
  id text primary key,
  thread_id text not null references public.life_threads(id),
  version integer not null check (version > 0),
  actor text not null check (actor in ('demo_user', 'recorded_fixture')),
  command text not null,
  change_summary text not null,
  previous_version integer not null check (previous_version >= 0),
  created_at timestamptz not null,
  unique (thread_id, version)
);

create table public.analysis_runs (
  id text primary key,
  thread_id text not null references public.life_threads(id),
  input_revision_id text not null,
  idempotency_key text not null,
  outcome text not null,
  created_at timestamptz not null,
  unique (thread_id, idempotency_key)
);

create table public.evidence_items (
  id text primary key,
  thread_id text not null references public.life_threads(id),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  private_object_key text,
  metadata jsonb not null,
  deleted_at timestamptz,
  unique (thread_id, checksum)
);

create table public.source_references (
  id text primary key,
  thread_id text not null references public.life_threads(id),
  evidence_id text not null references public.evidence_items(id),
  locator jsonb not null,
  created_at timestamptz not null
);

alter table public.demo_profiles enable row level security;
alter table public.life_threads enable row level security;
alter table public.thread_revisions enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.evidence_items enable row level security;
alter table public.source_references enable row level security;
