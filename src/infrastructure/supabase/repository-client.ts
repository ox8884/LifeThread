import type { SupabaseClient } from "@supabase/supabase-js";
import type { LifeThreadAggregate } from "@/domain/entities";

type LifeThreadRow = Readonly<{
  owner_id: string;
  id: string;
  title: string;
  goal_text: string;
  version: number;
  review_count: number;
  aggregate: unknown;
  created_at: string;
  updated_at: string;
}>;

type SaveAggregateRow = Readonly<{
  kind: string;
  actual_version: number | null;
}>;

export type LifeThreadDatabase = Readonly<{
  public: Readonly<{
    Tables: Readonly<{
      life_threads: Readonly<{
        Row: LifeThreadRow;
        Insert: LifeThreadRow;
        Update: Partial<LifeThreadRow>;
        Relationships: [];
      }>;
    }>;
    Views: Record<never, never>;
    Functions: Readonly<{
      save_lifethread_aggregate: Readonly<{
        Args: Readonly<{
          p_thread_id: string;
          p_expected_version: number | null;
          p_aggregate: LifeThreadAggregate;
        }>;
        Returns: SaveAggregateRow[];
      }>;
    }>;
  }>;
}>;

export type RepositoryClient = SupabaseClient<LifeThreadDatabase>;
