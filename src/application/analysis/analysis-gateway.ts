import type { RevisionActor } from "@/domain/actors";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { Locale } from "@/i18n/locales";

export type AnalysisRequest = Readonly<{
  aggregate: LifeThreadAggregate;
  locale: Locale;
  reason: "initial_goal" | "new_evidence" | "manual_refresh";
  source_reference_id: string;
}>;

export interface AnalysisGateway {
  readonly actor: RevisionActor;
  analyze(request: AnalysisRequest): Promise<unknown>;
}
