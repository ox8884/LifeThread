import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  SupabaseRepositoryError,
  SupabaseThreadRepository,
} from "@/infrastructure/supabase/supabase-thread-repository";
import type { LifeThreadDatabase } from "@/infrastructure/supabase/repository-client";
import { ThreadOwnerMismatchError } from "@/application/threads/thread-repository";
import { lifeThreadAggregateSchema } from "@/domain/entities";
import { canonicalSerialize } from "@/domain/serialization";
import { createAggregateFixture, USER_ID } from "@tests/fixtures/domain";

type FakeRequest = Readonly<{
  url: URL;
  method: string;
  authorization: string | null;
  body: string | null;
}>;

type FakeResponse = Readonly<{
  status: number;
  body: unknown;
}>;

type FakeResponder = (request: FakeRequest) => FakeResponse;

const rpcBodySchema = z.object({
  p_thread_id: z.string(),
  p_expected_version: z.number().int().nullable(),
  p_aggregate: lifeThreadAggregateSchema,
}).strict();

function createFakeAuthenticatedClient(responder: FakeResponder) {
  const requests: FakeRequest[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const body = request.body ? await request.text() : null;
    const recorded = {
      url: new URL(request.url),
      method: request.method,
      authorization: request.headers.get("authorization"),
      body,
    } satisfies FakeRequest;
    requests.push(recorded);
    const response = responder(recorded);
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  };
  const client = createClient<LifeThreadDatabase>(
    "https://lifethread.test.supabase.co",
    "sb_publishable_test",
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        fetch: fakeFetch,
        headers: { Authorization: "Bearer authenticated-user-token" },
      },
    },
  );
  return { client, requests };
}

describe("authenticated Supabase thread repository", () => {
  it("lists only owner summaries in database order", async () => {
    // Given an authenticated user client returning one owner-scoped summary
    const row = {
      id: "thread_fixture",
      title: "Study plan",
      goal_text: "한국어와 English를 섞어 학습 계획 만들기",
      version: 2,
      updated_at: "2026-07-15T12:01:00.000Z",
      review_count: 3,
    };
    const { client, requests } = createFakeAuthenticatedClient(() => ({
      status: 200,
      body: [row],
    }));

    // When the repository lists the authenticated owner
    const summaries = await new SupabaseThreadRepository(client).list(USER_ID);

    // Then the query and returned contract are owner-scoped and summary-only
    expect(summaries).toEqual([row]);
    const request = requests[0];
    expect(request).toBeDefined();
    if (!request) return;
    expect(request.url.pathname).toBe("/rest/v1/life_threads");
    expect(request.url.searchParams.get("owner_id")).toBe(`eq.${USER_ID}`);
    expect(request.url.searchParams.get("order")).toBe("updated_at.desc");
    expect(request.authorization).toBe("Bearer authenticated-user-token");
  });

  it("loads and parses one aggregate inside its owner scope", async () => {
    // Given an authenticated user client returning a canonical aggregate row
    const aggregate = createAggregateFixture();
    const { client, requests } = createFakeAuthenticatedClient(() => ({
      status: 200,
      body: { aggregate },
    }));

    // When the owner loads that thread
    const loaded = await new SupabaseThreadRepository(client).load(
      USER_ID,
      aggregate.thread.id,
    );

    // Then the aggregate crosses the schema boundary and both filters reach PostgREST
    expect(loaded ? canonicalSerialize(loaded) : null).toBe(canonicalSerialize(aggregate));
    const request = requests[0];
    expect(request).toBeDefined();
    if (!request) return;
    expect(request.url.searchParams.get("owner_id")).toBe(`eq.${USER_ID}`);
    expect(request.url.searchParams.get("id")).toBe(`eq.${aggregate.thread.id}`);
  });

  it("returns null when RLS exposes no cross-owner row", async () => {
    // Given an authenticated client whose owner-scoped query returns no row
    const otherOwnerId = "22222222-2222-4222-8222-222222222222";
    const { client } = createFakeAuthenticatedClient(() => ({ status: 200, body: null }));

    // When that owner requests another thread identifier
    const loaded = await new SupabaseThreadRepository(client).load(
      otherOwnerId,
      "thread_fixture",
    );

    // Then the repository does not reveal the aggregate
    expect(loaded).toBeNull();
  });

  it("maps a saved atomic RPC response", async () => {
    // Given an authenticated client accepting an initial aggregate transaction
    const aggregate = createAggregateFixture();
    const { client, requests } = createFakeAuthenticatedClient(() => ({
      status: 200,
      body: [{ kind: "saved", actual_version: 1 }],
    }));

    // When the owner performs an initial save
    const result = await new SupabaseThreadRepository(client).save(USER_ID, aggregate, null);

    // Then the closed result maps to saved and the RPC receives the canonical aggregate
    expect(result).toEqual({ kind: "saved" });
    const request = requests[0];
    expect(request).toBeDefined();
    if (!request?.body) return;
    expect(request.url.pathname).toBe("/rest/v1/rpc/save_lifethread_aggregate");
    expect(rpcBodySchema.parse(JSON.parse(request.body))).toEqual({
      p_thread_id: aggregate.thread.id,
      p_expected_version: null,
      p_aggregate: aggregate,
    });
  });

  it("maps a stale atomic RPC response with its actual version", async () => {
    // Given an authenticated client rejecting an outdated expected version
    const aggregate = createAggregateFixture();
    const { client } = createFakeAuthenticatedClient(() => ({
      status: 200,
      body: [{ kind: "stale_version", actual_version: 2 }],
    }));

    // When the owner saves from version one
    const result = await new SupabaseThreadRepository(client).save(USER_ID, aggregate, 1);

    // Then the repository preserves the database's actual version
    expect(result).toEqual({ kind: "stale_version", actual_version: 2 });
  });

  it("rejects an aggregate owner mismatch before making a request", async () => {
    // Given a caller who does not own the aggregate
    const aggregate = createAggregateFixture();
    const otherOwnerId = "22222222-2222-4222-8222-222222222222";
    const { client, requests } = createFakeAuthenticatedClient(() => ({
      status: 500,
      body: { message: "must not be called" },
    }));

    // When the caller attempts to save it
    const save = new SupabaseThreadRepository(client).save(otherOwnerId, aggregate, null);

    // Then the typed authorization error occurs before PostgREST
    await expect(save).rejects.toBeInstanceOf(ThreadOwnerMismatchError);
    expect(requests).toHaveLength(0);
  });

  it("surfaces PostgREST failures as typed repository errors", async () => {
    // Given an authenticated client receiving a denied query response
    const { client } = createFakeAuthenticatedClient(() => ({
      status: 403,
      body: { code: "42501", details: null, hint: null, message: "permission denied" },
    }));

    // When the repository lists the owner
    const list = new SupabaseThreadRepository(client).list(USER_ID);

    // Then the infrastructure failure remains typed for the boundary
    await expect(list).rejects.toBeInstanceOf(SupabaseRepositoryError);
  });

  it("does not expose local demo reset capability through the production repository", () => {
    // Given an authenticated repository without elevated delete privileges
    const { client, requests } = createFakeAuthenticatedClient(() => ({
      status: 500,
      body: { message: "must not be called" },
    }));
    const repository = new SupabaseThreadRepository(client);

    // When its public capabilities are inspected

    // Then no reset operation is available to the authenticated production adapter
    expect("resetOwner" in repository).toBe(false);
    expect(requests).toHaveLength(0);
  });
});
