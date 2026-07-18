import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publicTables = [
  "life_threads",
  "thread_revisions",
  "analysis_runs",
  "evidence_items",
  "source_references",
] as const;

const migration = (
  await readFile(
    resolve("supabase/migrations/0003_authenticated_multithread.sql"),
    "utf8",
  )
).replace(/\s+/gu, " ").toLowerCase();
const ownerCheck = "((select auth.uid()) is not null and (select auth.uid()) = owner_id)";

describe("authenticated Supabase persistence contract", () => {
  it("enables indexed owner RLS and explicit authenticated grants on every public table", () => {
    // Given the authenticated multi-thread migration
    for (const table of publicTables) {
      // When each exposed table contract is inspected
      // Then grants, RLS, SELECT, and owner-preserving UPDATE policies are explicit
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(
        `grant select, insert, update on table public.${table} to authenticated`,
      );
      expect(migration).toContain(
        `create policy ${table}_select_owner on public.${table} for select to authenticated using ${ownerCheck}`,
      );
      expect(migration).toContain(
        `create policy ${table}_update_owner on public.${table} for update to authenticated using ${ownerCheck} with check ${ownerCheck}`,
      );
      expect(migration).toMatch(new RegExp(
        `create (?:unique )?index [^;]+ on public\\.${table} \\([^;]*owner_id`,
        "u",
      ));
    }
    expect(migration).toContain("drop table if exists public.demo_profiles");
    expect(migration).not.toMatch(/create table public\.demo_profiles|references public\.demo_profiles/u);
    expect(migration).not.toContain("service_role");
  });

  it("keeps the atomic aggregate save owner-bound and security-invoker", () => {
    // Given the remotely callable aggregate transaction
    const functionStart = migration.indexOf(
      "create or replace function public.save_lifethread_aggregate",
    );
    const functionEnd = migration.indexOf("$$;", functionStart);
    const saveFunction = migration.slice(functionStart, functionEnd);

    // When its privilege and optimistic-locking contract is inspected
    expect(functionStart).toBeGreaterThanOrEqual(0);

    // Then it authenticates the owner, checks the expected version, and never elevates
    expect(saveFunction).toContain("security invoker");
    expect(saveFunction).not.toContain("security definer");
    expect(saveFunction).toContain("auth.uid()");
    expect(saveFunction).toContain("p_expected_version");
    expect(saveFunction).toContain("p_aggregate");
    expect(saveFunction).toContain("stale_version");
    expect(saveFunction).toContain("thread_revisions");
    expect(saveFunction).toContain("analysis_runs");
    expect(saveFunction).toContain("evidence_items");
    expect(saveFunction).toContain("source_references");
    expect(migration).toContain(
      "grant execute on function public.save_lifethread_aggregate(text, integer, jsonb) to authenticated",
    );
  });

  it("requires a consistent newest revision and rejects divergent revision identity", () => {
    // Given the aggregate save transaction
    const functionStart = migration.indexOf(
      "create or replace function public.save_lifethread_aggregate",
    );
    const functionEnd = migration.indexOf("$$;", functionStart);
    const saveFunction = migration.slice(functionStart, functionEnd);
    const revisionSectionStart = saveFunction.indexOf("v_revision :=");
    const revisionSectionEnd = saveFunction.indexOf("v_analysis_run :=", revisionSectionStart);
    const revisionSection = saveFunction.slice(revisionSectionStart, revisionSectionEnd);

    // When newest revision handling is inspected

    // Then its thread, version, and predecessor match the aggregate and conflicts raise
    expect(saveFunction).toContain("v_revision_thread_id is distinct from p_thread_id");
    expect(saveFunction).toContain("v_revision_version is distinct from v_version");
    expect(saveFunction).toContain(
      "v_revision_previous_version is distinct from coalesce(p_expected_version, v_version - 1)",
    );
    expect(saveFunction).toContain("revision identity conflicts with persisted revision");
    expect(revisionSection).not.toContain("on conflict (owner_id, thread_id, id) do nothing");
  });

  it("uses composite owner keys, Realtime, and private owner-prefixed Storage paths", () => {
    // Given child rows, Realtime, and private evidence objects
    const childOwnerKeys = migration.match(
      /foreign key \(owner_id, thread_id\) references public\.life_threads \(owner_id, id\)/gu,
    );

    // When the cross-service ownership contract is inspected
    expect(childOwnerKeys).toHaveLength(4);

    // Then every route remains inside the authenticated owner's namespace
    expect(migration).toContain("alter publication supabase_realtime add table public.life_threads");
    expect(migration).toContain("storage.foldername(name))[1]");
    expect(migration).toContain("auth.uid()::text");
    expect(migration).toContain("bucket_id = 'lifethread-evidence'");
  });
});
