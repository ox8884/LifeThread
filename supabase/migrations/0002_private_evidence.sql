insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lifethread-evidence',
  'lifethread-evidence',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

revoke all on public.life_threads from anon, authenticated;
revoke all on public.thread_revisions from anon, authenticated;
revoke all on public.analysis_runs from anon, authenticated;
revoke all on public.evidence_items from anon, authenticated;
revoke all on public.source_references from anon, authenticated;
