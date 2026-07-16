-- The fixed hackathon demo bootstrap is intentionally removed because this deployment has no production user data to preserve.
drop table if exists public.source_references cascade;
drop table if exists public.evidence_items cascade;
drop table if exists public.analysis_runs cascade;
drop table if exists public.thread_revisions cascade;
drop table if exists public.life_threads cascade;
drop table if exists public.demo_profiles cascade;

create table public.life_threads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  goal_text text not null check (char_length(goal_text) between 1 and 2000),
  version integer not null check (version > 0),
  review_count integer not null check (review_count >= 0),
  aggregate jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (owner_id, id),
  check (jsonb_typeof(aggregate) = 'object'),
  check (aggregate #>> '{thread,id}' is not null and aggregate #>> '{thread,id}' = id),
  check (aggregate #>> '{thread,owner_id}' is not null and (aggregate #>> '{thread,owner_id}')::uuid = owner_id),
  check (aggregate #>> '{thread,version}' is not null and (aggregate #>> '{thread,version}')::integer = version)
);

create table public.thread_revisions (
  owner_id uuid not null,
  thread_id text not null,
  id text not null,
  version integer not null check (version > 0),
  actor_type text not null check (actor_type in ('recorded_fixture', 'user', 'chatgpt_app')),
  actor_user_id uuid,
  command text not null,
  change_summary text not null,
  previous_version integer not null check (previous_version >= 0),
  created_at timestamptz not null,
  primary key (owner_id, thread_id, id),
  unique (owner_id, thread_id, version),
  foreign key (owner_id, thread_id) references public.life_threads (owner_id, id) on delete cascade,
  check (
    (actor_type = 'recorded_fixture' and actor_user_id is null)
    or (actor_type in ('user', 'chatgpt_app') and actor_user_id = owner_id)
  )
);

create table public.analysis_runs (
  owner_id uuid not null,
  thread_id text not null,
  id text not null,
  input_revision_id text not null,
  schema_version text not null,
  model_version text not null,
  idempotency_key text not null,
  outcome text not null,
  error_category text,
  created_at timestamptz not null,
  primary key (owner_id, thread_id, id),
  unique (owner_id, thread_id, idempotency_key),
  foreign key (owner_id, thread_id) references public.life_threads (owner_id, id) on delete cascade
);

create table public.evidence_items (
  owner_id uuid not null,
  thread_id text not null,
  id text not null,
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  private_object_key text,
  metadata jsonb not null,
  deleted_at timestamptz,
  primary key (owner_id, thread_id, id),
  unique (owner_id, thread_id, checksum),
  foreign key (owner_id, thread_id) references public.life_threads (owner_id, id) on delete cascade,
  check (metadata #>> '{thread_id}' is not null and metadata #>> '{thread_id}' = thread_id)
);

create table public.source_references (
  owner_id uuid not null,
  thread_id text not null,
  id text not null,
  evidence_id text not null,
  locator jsonb not null,
  created_at timestamptz not null,
  primary key (owner_id, thread_id, id),
  foreign key (owner_id, thread_id) references public.life_threads (owner_id, id) on delete cascade,
  foreign key (owner_id, thread_id, evidence_id) references public.evidence_items (owner_id, thread_id, id) on delete cascade
);

create index life_threads_owner_updated_idx on public.life_threads (owner_id, updated_at desc);
create index thread_revisions_owner_thread_idx on public.thread_revisions (owner_id, thread_id);
create index analysis_runs_owner_thread_idx on public.analysis_runs (owner_id, thread_id);
create index evidence_items_owner_thread_idx on public.evidence_items (owner_id, thread_id);
create index source_references_owner_thread_idx on public.source_references (owner_id, thread_id);
create index source_references_evidence_idx on public.source_references (owner_id, thread_id, evidence_id);

alter table public.life_threads enable row level security;
alter table public.thread_revisions enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.evidence_items enable row level security;
alter table public.source_references enable row level security;

revoke all on table public.life_threads from anon, authenticated;
revoke all on table public.thread_revisions from anon, authenticated;
revoke all on table public.analysis_runs from anon, authenticated;
revoke all on table public.evidence_items from anon, authenticated;
revoke all on table public.source_references from anon, authenticated;
grant select, insert, update on table public.life_threads to authenticated;
grant select, insert, update on table public.thread_revisions to authenticated;
grant select, insert, update on table public.analysis_runs to authenticated;
grant select, insert, update on table public.evidence_items to authenticated;
grant select, insert, update on table public.source_references to authenticated;

create policy life_threads_select_owner on public.life_threads for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy life_threads_insert_owner on public.life_threads for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy life_threads_update_owner on public.life_threads for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy thread_revisions_select_owner on public.thread_revisions for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy thread_revisions_insert_owner on public.thread_revisions for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy thread_revisions_update_owner on public.thread_revisions for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy analysis_runs_select_owner on public.analysis_runs for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy analysis_runs_insert_owner on public.analysis_runs for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy analysis_runs_update_owner on public.analysis_runs for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy evidence_items_select_owner on public.evidence_items for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy evidence_items_insert_owner on public.evidence_items for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy evidence_items_update_owner on public.evidence_items for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy source_references_select_owner on public.source_references for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy source_references_insert_owner on public.source_references for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy source_references_update_owner on public.source_references for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create or replace function public.save_lifethread_aggregate(
  p_thread_id text,
  p_expected_version integer,
  p_aggregate jsonb
)
returns table(kind text, actual_version integer)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_thread jsonb;
  v_thread_id text;
  v_aggregate_owner_id uuid;
  v_version integer;
  v_review_count integer;
  v_actual_version integer;
  v_revision jsonb;
  v_revision_thread_id text;
  v_revision_version integer;
  v_revision_previous_version integer;
  v_revision_actor_user_id uuid;
  v_revision_created_at timestamptz;
  v_existing_revision public.thread_revisions%rowtype;
  v_analysis_run jsonb;
begin
  if v_owner_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if p_aggregate is null or jsonb_typeof(p_aggregate) <> 'object' then
    raise exception using errcode = '22023', message = 'Aggregate must be a JSON object';
  end if;

  v_thread := p_aggregate -> 'thread';
  v_thread_id := v_thread ->> 'id';
  v_aggregate_owner_id := nullif(v_thread ->> 'owner_id', '')::uuid;
  v_version := nullif(v_thread ->> 'version', '')::integer;
  if v_thread_id is distinct from p_thread_id then
    raise exception using errcode = '22023', message = 'Thread identifier does not match aggregate';
  end if;
  if v_aggregate_owner_id is distinct from v_owner_id then
    raise exception using errcode = '42501', message = 'Aggregate owner does not match caller';
  end if;
  if v_version is null or v_version < 1 or (p_expected_version is not null and v_version <= p_expected_version) then
    raise exception using errcode = '23514', message = 'Aggregate version is invalid';
  end if;

  select (
    (select count(*) from jsonb_array_elements(p_aggregate -> 'tasks') as task(value)
      where task.value ->> 'deleted_at' is null and task.value ->> 'status' = 'proposed')
    - case when (
      select task.value ->> 'status' from jsonb_array_elements(p_aggregate -> 'tasks') as task(value)
      where task.value ->> 'deleted_at' is null
        and task.value ->> 'status' in ('in_progress', 'pending', 'waiting', 'blocked', 'overdue', 'proposed')
      order by case task.value ->> 'status'
        when 'in_progress' then 0 when 'pending' then 1 when 'waiting' then 2
        when 'blocked' then 3 when 'overdue' then 4 else 5 end,
        (task.value ->> 'position')::integer
      limit 1
    ) = 'proposed' then 1 else 0 end
    + (select count(*) from jsonb_array_elements(p_aggregate -> 'facts') as fact(value)
      where not coalesce((fact.value ->> 'user_confirmed')::boolean, false))
    + (select count(*) from jsonb_array_elements(p_aggregate -> 'conflicts') as conflict(value)
      where conflict.value ->> 'status' = 'unresolved')
  )::integer into v_review_count;

  if p_expected_version is null then
    insert into public.life_threads (
      owner_id, id, title, goal_text, version, review_count, aggregate, created_at, updated_at
    ) values (
      v_owner_id, p_thread_id, v_thread ->> 'title', v_thread ->> 'goal_text', v_version,
      v_review_count, p_aggregate, (v_thread ->> 'created_at')::timestamptz,
      (v_thread ->> 'updated_at')::timestamptz
    ) on conflict (owner_id, id) do nothing returning version into v_actual_version;
  else
    update public.life_threads set
      title = v_thread ->> 'title', goal_text = v_thread ->> 'goal_text', version = v_version,
      review_count = v_review_count, aggregate = p_aggregate,
      updated_at = (v_thread ->> 'updated_at')::timestamptz
    where owner_id = v_owner_id and id = p_thread_id and version = p_expected_version
    returning version into v_actual_version;
  end if;

  if v_actual_version is null then
    select thread.version into v_actual_version from public.life_threads as thread
    where thread.owner_id = v_owner_id and thread.id = p_thread_id;
    return query select 'stale_version'::text, v_actual_version;
    return;
  end if;

  v_revision := p_aggregate -> 'revisions' -> -1;
  if v_revision is null or jsonb_typeof(v_revision) <> 'object' then
    raise exception using errcode = '23514', message = 'Aggregate requires a newest revision';
  end if;
  v_revision_thread_id := v_revision ->> 'thread_id';
  v_revision_version := nullif(v_revision ->> 'version', '')::integer;
  v_revision_previous_version := nullif(v_revision ->> 'previous_version', '')::integer;
  v_revision_actor_user_id := nullif(v_revision ->> 'actor_user_id', '')::uuid;
  v_revision_created_at := nullif(v_revision ->> 'created_at', '')::timestamptz;
  if v_revision_thread_id is distinct from p_thread_id then
    raise exception using errcode = '23514', message = 'Newest revision thread identifier does not match aggregate';
  end if;
  if v_revision_version is distinct from v_version then
    raise exception using errcode = '23514', message = 'Newest revision version does not match aggregate';
  end if;
  if v_revision_previous_version is distinct from coalesce(p_expected_version, 0) then
    raise exception using errcode = '23514', message = 'Newest revision predecessor does not match expected version';
  end if;

  select revision.* into v_existing_revision
  from public.thread_revisions as revision
  where revision.owner_id = v_owner_id
    and revision.thread_id = p_thread_id
    and (revision.id = v_revision ->> 'id' or revision.version = v_revision_version)
  limit 1;
  if found then
    if v_existing_revision.id is distinct from v_revision ->> 'id'
      or v_existing_revision.version is distinct from v_revision_version
      or v_existing_revision.actor_type is distinct from v_revision ->> 'actor_type'
      or v_existing_revision.actor_user_id is distinct from v_revision_actor_user_id
      or v_existing_revision.command is distinct from v_revision ->> 'command'
      or v_existing_revision.change_summary is distinct from v_revision ->> 'change_summary'
      or v_existing_revision.previous_version is distinct from v_revision_previous_version
      or v_existing_revision.created_at is distinct from v_revision_created_at then
      raise exception using errcode = '23505', message = 'Revision identity conflicts with persisted revision';
    end if;
  else
    insert into public.thread_revisions (
      owner_id, thread_id, id, version, actor_type, actor_user_id, command,
      change_summary, previous_version, created_at
    ) values (
      v_owner_id, p_thread_id, v_revision ->> 'id', v_revision_version,
      v_revision ->> 'actor_type', v_revision_actor_user_id,
      v_revision ->> 'command', v_revision ->> 'change_summary',
      v_revision_previous_version, v_revision_created_at
    );
  end if;

  v_analysis_run := p_aggregate -> 'analysis_runs' -> -1;
  if v_analysis_run is not null then
    insert into public.analysis_runs (
      owner_id, thread_id, id, input_revision_id, schema_version, model_version,
      idempotency_key, outcome, error_category, created_at
    ) values (
      v_owner_id, p_thread_id, v_analysis_run ->> 'id', v_analysis_run ->> 'input_revision_id',
      v_analysis_run ->> 'schema_version', v_analysis_run ->> 'model_version',
      v_analysis_run ->> 'idempotency_key', v_analysis_run ->> 'outcome',
      v_analysis_run ->> 'error_category', (v_analysis_run ->> 'created_at')::timestamptz
    ) on conflict (owner_id, thread_id, id) do nothing;
  end if;

  insert into public.evidence_items (
    owner_id, thread_id, id, checksum, private_object_key, metadata, deleted_at
  ) select
    v_owner_id, p_thread_id, evidence.value ->> 'id', evidence.value ->> 'checksum',
    evidence.value ->> 'private_object_key', evidence.value,
    nullif(evidence.value ->> 'deleted_at', '')::timestamptz
  from jsonb_array_elements(p_aggregate -> 'evidence') as evidence(value)
  on conflict (owner_id, thread_id, id) do update set
    checksum = excluded.checksum, private_object_key = excluded.private_object_key,
    metadata = excluded.metadata, deleted_at = excluded.deleted_at;

  insert into public.source_references (
    owner_id, thread_id, id, evidence_id, locator, created_at
  ) select
    v_owner_id, p_thread_id, reference.value ->> 'id', reference.value ->> 'evidence_id',
    jsonb_build_object(
      'kind', reference.value ->> 'locator_kind', 'value', reference.value ->> 'locator',
      'quoted_hash', reference.value ->> 'quoted_hash'
    ), (reference.value ->> 'created_at')::timestamptz
  from jsonb_array_elements(p_aggregate -> 'source_references') as reference(value)
  on conflict (owner_id, thread_id, id) do nothing;

  return query select 'saved'::text, v_version;
end;
$$;

revoke execute on function public.save_lifethread_aggregate(text, integer, jsonb) from public, anon;
grant execute on function public.save_lifethread_aggregate(text, integer, jsonb) to authenticated;

alter publication supabase_realtime add table public.life_threads;

drop policy if exists lifethread_evidence_select_owner on storage.objects;
drop policy if exists lifethread_evidence_insert_owner on storage.objects;
drop policy if exists lifethread_evidence_update_owner on storage.objects;
drop policy if exists lifethread_evidence_delete_owner on storage.objects;
create policy lifethread_evidence_select_owner on storage.objects for select to authenticated using (auth.uid() is not null and bucket_id = 'lifethread-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lifethread_evidence_insert_owner on storage.objects for insert to authenticated with check (auth.uid() is not null and bucket_id = 'lifethread-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lifethread_evidence_update_owner on storage.objects for update to authenticated using (auth.uid() is not null and bucket_id = 'lifethread-evidence' and (storage.foldername(name))[1] = auth.uid()::text) with check (auth.uid() is not null and bucket_id = 'lifethread-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lifethread_evidence_delete_owner on storage.objects for delete to authenticated using (auth.uid() is not null and bucket_id = 'lifethread-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
