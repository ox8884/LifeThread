"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/browser-client";

type RealtimeThreadSyncProps = Readonly<{
  ownerId: string | undefined;
}>;

type SyncState = "idle" | "subscribed" | "channel_error" | "timed_out" | "closed";

const statusText: Readonly<Record<SyncState, string>> = {
  idle: "Live sync ready",
  subscribed: "Live sync connected",
  channel_error: "Live sync needs refresh",
  timed_out: "Live sync timed out",
  closed: "Live sync closed",
};

function syncStateForStatus(status: REALTIME_SUBSCRIBE_STATES): SyncState {
  switch (status) {
    case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
      return "subscribed";
    case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
      return "channel_error";
    case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
      return "timed_out";
    case REALTIME_SUBSCRIBE_STATES.CLOSED:
      return "closed";
  }
}

function requiresManualRefresh(state: SyncState): boolean {
  return state === "channel_error" || state === "timed_out" || state === "closed";
}

export function RealtimeThreadSync({ ownerId }: RealtimeThreadSyncProps) {
  if (ownerId === undefined) {
    return (
      <div role="status" aria-label="Live sync status">
        <span>{statusText.idle}</span>
      </div>
    );
  }

  return <ActiveRealtimeThreadSync ownerId={ownerId} />;
}

type ActiveRealtimeThreadSyncProps = Readonly<{
  ownerId: string;
}>;

function ActiveRealtimeThreadSync({ ownerId }: ActiveRealtimeThreadSyncProps) {
  const router = useRouter();
  const [syncState, setSyncState] = useState<SyncState>("idle");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`life_threads:${ownerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "life_threads",
        },
        () => router.refresh(),
      )
      .subscribe((status) => setSyncState(syncStateForStatus(status)));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ownerId, router]);

  return (
    <div role="status" aria-label="Live sync status">
      <span>{statusText[syncState]}</span>
      {requiresManualRefresh(syncState) ? (
        <button type="button" onClick={() => router.refresh()}>
          Refresh
        </button>
      ) : null}
    </div>
  );
}
