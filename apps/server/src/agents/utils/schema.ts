import { z } from "zod";

/**
 * Kinds the LLM assigns to extracted entities.
 *
 * Hierarchy:
 *   Topic is the umbrella — it names what the conversation is *about*.
 *   All other entity kinds can be tagged with `topic` to place them under it.
 *
 * NOTE: "Person" here means a named individual mentioned in the text
 * (e.g. "Primeagen", "@alice"). It is stored as an `Entity` vertex, NOT
 * as a `Person` vertex — platform-authenticated users live in the `Person`
 * vertex type and are created exclusively by the deterministic pipeline.
 */
export const entityKinds = [
  "Topic",        // the umbrella subject the message is primarily about (e.g. "Rust async runtime", "weekend plans")
  "Todo",         // an actionable task or follow-up implied or stated in the text
  "Person",       // a human mentioned by name or handle
  "Platform",     // a website, service, or app (Twitch, GitHub, YouTube)
  "Technology",   // language, framework, library, or tool (Rust, React, Docker)
  "Project",      // repo, game, product, or named work
  "Organization", // company, community, or team
  "Location",     // place, city, or region
  "Event",        // conference, release, deadline, meeting, or scheduled activity
  "Other",        // anything concrete that doesn't fit above
] as const;

export type EntityKind = (typeof entityKinds)[number];


export const EntitySchema = z.object({
  name: z.string().describe(
    "Canonical name of the entity. Preserve original capitalisation, no surrounding articles.",
  ),
  kind: z.enum(entityKinds),

  /**
   * The name of the Topic entity this entity falls under.
   * Omit if this entity IS the Topic, or if there is no clear parent topic.
   */
  topic: z.string().nullish().describe(
    "Name of the parent Topic entity this entity belongs to. Omit for Topic entities themselves.",
  ),

  // ── Event-specific ───────────────────────────────────────────────────────
  /** Original time expression from the text, e.g. "tomorrow", "next week". Event / Todo kind only. */
  rawTemporal: z.string().nullish(),
  /** Resolved ISO 8601 date/datetime relative to message send time. Event / Todo kind only. */
  scheduledAt: z.string().nullish(),

  // ── Todo-specific ─────────────────────────────────────────────────────────
  /** Short human-readable description of what needs to be done. Todo kind only. */
  todoDescription: z.string().nullish().describe(
    "What exactly needs to be done. Todo kind only.",
  ),
});

export const ExtractionSchema = z.object({
  entities: z.array(EntitySchema),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
export type ExtractedEntity = z.infer<typeof EntitySchema>;

// ── Enrichment update plan (output of planNode) ───────────────────────────────

export const UpdateActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("merge"),
    /** Name of the incoming entity (may not yet exist in the graph). */
    incomingName: z.string(),
    /** Canonical name of the existing entity to merge into. */
    targetName: z.string(),
    reason: z.string(),
  }),
  z.object({
    action: z.literal("update"),
    /** Name of the existing entity to patch. */
    targetName: z.string(),
    /** Key/value pairs of Entity properties to overwrite. */
    fields: z.object({
      name: z.string().nullish(),
      kind: z.string().nullish(),
      topic: z.string().nullish(),
      rawTemporal: z.string().nullish(),
      scheduledAt: z.string().nullish(),
      todoDescription: z.string().nullish(),
    }),
    reason: z.string(),
  }),
  z.object({
    action: z.literal("noop"),
    reason: z.string(),
  }),
]);

export const UpdatePlanSchema = z.object({
  actions: z.array(UpdateActionSchema),
});

export type UpdateAction = z.infer<typeof UpdateActionSchema>;
export type UpdatePlan = z.infer<typeof UpdatePlanSchema>;
