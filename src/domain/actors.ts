import { z } from "zod";

export const revisionActorSchema = z.discriminatedUnion("actor_type", [
  z.object({ actor_type: z.literal("recorded_fixture"), actor_user_id: z.null() }).strict(),
  z.object({ actor_type: z.literal("user"), actor_user_id: z.string().uuid() }).strict(),
  z.object({ actor_type: z.literal("chatgpt_app"), actor_user_id: z.string().uuid() }).strict(),
]);

export type RevisionActor = z.infer<typeof revisionActorSchema>;
export type AuthenticatedRevisionActor = Exclude<
  RevisionActor,
  Readonly<{ actor_type: "recorded_fixture"; actor_user_id: null }>
>;

export const recordedFixtureOwnerId = "00000000-0000-4000-8000-000000000001";
export const recordedFixtureActor = {
  actor_type: "recorded_fixture",
  actor_user_id: null,
} as const satisfies RevisionActor;

export function parseAuthenticatedActor(value: unknown): AuthenticatedRevisionActor | null {
  const parsed = revisionActorSchema.safeParse(value);
  if (!parsed.success || parsed.data.actor_type === "recorded_fixture") return null;
  return parsed.data;
}

export function ownsThread(actor: RevisionActor, ownerId: string): boolean {
  switch (actor.actor_type) {
    case "recorded_fixture":
      return false;
    case "user":
      return actor.actor_user_id === ownerId;
    case "chatgpt_app":
      return actor.actor_user_id === ownerId;
  }
}

export function canReconcileThread(actor: RevisionActor, ownerId: string): boolean {
  switch (actor.actor_type) {
    case "recorded_fixture":
      return true;
    case "user":
      return actor.actor_user_id === ownerId;
    case "chatgpt_app":
      return actor.actor_user_id === ownerId;
  }
}
