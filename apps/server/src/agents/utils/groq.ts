import { ChatGroq } from "@langchain/groq";
import { env } from "@second-brain/env/server";
import { ExtractionSchema, UpdatePlanSchema } from "./schema";
import type { EnrichmentCandidate, TopicContextEntity } from "./types";

const apiKey = env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is required for the knowledge graph worker");
}

export const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey,
  temperature: 0,
});

export const extractor = llm.withStructuredOutput(ExtractionSchema);

export async function extractKnowledge(text: string, messageCreatedAt: string) {
  return extractor.invoke(`
Extract entities from the message text below.

Message sent at: ${messageCreatedAt} (use this as "now" when resolving relative time expressions)

════════════════════════════════════════
STRUCTURE  (read this first)
════════════════════════════════════════

Every message maps to a tree:

    Topic  ← ONE mandatory root entity that names what the conversation is about
    ├── Todo
    ├── Event
    ├── Person
    ├── Project
    ├── Technology
    ├── Platform
    ├── Organization
    ├── Location
    └── Other

Step 1 — Identify the Topic (the headline of the message).
Step 2 — Extract all other entities and link each one to that Topic via its \`topic\` field.

════════════════════════════════════════
ENTITY KINDS  (assign exactly one per entity)
════════════════════════════════════════

• Topic        — MANDATORY. The single overarching subject the message is about.
                 Name it in 1-4 words (e.g. "Rust async runtime", "CA report submission",
                 "weekend trip planning", "Q3 sprint review").
                 There is EXACTLY ONE Topic per message — never zero, never two.
                 Do NOT set a \`topic\` field on the Topic entity itself.

• Todo         — An actionable task or follow-up, either stated explicitly
                 ("I need to …", "don't forget to …", "we should …") or clearly
                 implied ("the report is due Friday" → Todo: submit the report).
                 Extract one Todo per distinct action item.
                 MUST set \`topic\` to the Topic entity's name.

• Person       — A human mentioned by name or handle (e.g. "Primeagen", "@alice").
                 MUST set \`topic\` to the Topic entity's name.
• Platform     — A website, service, or app (e.g. "Twitch", "GitHub", "YouTube").
                 MUST set \`topic\` to the Topic entity's name.
• Technology   — A language, framework, library, or tool (e.g. "Rust", "React", "Docker").
                 MUST set \`topic\` to the Topic entity's name.
• Project      — A repo, game, product, or named work (e.g. "neovim", "Doom Eternal").
                 MUST set \`topic\` to the Topic entity's name.
• Organization — A company, community, or team (e.g. "Vercel", "The Primes").
                 MUST set \`topic\` to the Topic entity's name.
• Location     — A place, city, or region (e.g. "San Francisco", "Europe").
                 MUST set \`topic\` to the Topic entity's name.
• Event        — A time-bound happening: conference, release, deadline, meeting,
                 submission, or scheduled activity (e.g. "RustConf", "team standup").
                 MUST set \`topic\` to the Topic entity's name.
• Other        — Anything concrete that doesn't fit the above.
                 MUST set \`topic\` to the Topic entity's name.

════════════════════════════════════════
FIELDS
════════════════════════════════════════

Every entity:
  name   — canonical name; preserve original capitalisation, no surrounding articles.
  kind   — one of the kinds above.
  topic  — name of the Topic entity this entity belongs to.
           • OMIT for the Topic entity itself.
           • REQUIRED for every other entity — use the exact name of the Topic entity.

Event entities additionally:
  rawTemporal  — the time expression exactly as written (e.g. "tomorrow", "next week", "Monday at 3pm").
  scheduledAt  — resolved ISO 8601 datetime relative to "Message sent at":
                 • "tomorrow"  → next calendar day at 00:00:00.000Z
                 • "next week" → Monday of next week at 00:00:00.000Z
                 • "at 3pm"    → same day as message, 15:00:00.000Z
                 • Omit both if no time expression is present.

Todo entities additionally:
  todoDescription — short sentence describing exactly what must be done.
  rawTemporal     — due-date expression as written, if any.
  scheduledAt     — resolved ISO 8601 due date/datetime, if any.

════════════════════════════════════════
RULES
════════════════════════════════════════
- ALWAYS produce exactly one Topic entity — this is mandatory, not optional.
- Extract the Topic first; use its name as the \`topic\` field for every other entity.
- If the message covers multiple unrelated subjects, pick the dominant one as the Topic.
- Extract a Todo whenever an action is stated or clearly implied — even if phrased passively
  (e.g. "the PR needs a review" → Todo: review PR).
- Include entities explicitly mentioned OR clearly implied by context.
- Give implied events/todos a descriptive name combining subject and action
  (e.g. "math project submission", "weekly standup meeting").
- Do NOT include the message author as an entity (tracked separately by the deterministic pipeline).
- Do NOT invent the message itself as an entity.
- Prefer specific, named entities over generic terms.
- SKIP any entry whose name looks like a raw platform ID (all-caps alphanumeric strings like
  "U0B87U18NMQ", "C0B7PLFS39V", snowflake integers). These are system identifiers, not entities.

════════════════════════════════════════
EXAMPLE
════════════════════════════════════════

Message: "hey the neovim plugin we're building needs to support Lua 5.4, Priya is handling it"

Entities:
  { kind: "Topic",      name: "neovim plugin development" }
  { kind: "Project",    name: "neovim plugin",  topic: "neovim plugin development" }
  { kind: "Technology", name: "Lua 5.4",         topic: "neovim plugin development" }
  { kind: "Person",     name: "Priya",            topic: "neovim plugin development" }
  { kind: "Todo",       name: "Lua 5.4 support",  topic: "neovim plugin development",
    todoDescription: "Add Lua 5.4 support to the neovim plugin" }

════════════════════════════════════════

Text:
${text}
`);
}

// ── Update-plan generator ─────────────────────────────────────────────────────

/**
 * A separate LLM instance for update planning — same model, no extraction
 * prompt, just a plain chat completion with structured output.
 */
const planner = llm.withStructuredOutput(UpdatePlanSchema);

/**
 * Given a list of enrichment candidates and/or a topic context, ask the LLM
 * to decide what should happen: merge two entities, update fields, or do nothing.
 *
 * topicContext — when provided, the planner is also shown the existing child
 * entities of the matched Topic and asked whether the incoming temporal data
 * (postponement, rescheduling, etc.) should propagate to them.
 */
export async function generateUpdatePlan(
  candidates: EnrichmentCandidate[],
  topicContext?: {
    /** Incoming entities from the new message that carry temporal updates. */
    incomingTemporalEntities: Array<{
      name: string;
      kind: string;
      scheduledAt?: string | null;
      rawTemporal?: string | null;
    }>;
    /** Existing entities already in the graph that belong to the matched Topic. */
    existingTopicEntities: TopicContextEntity[];
  },
): Promise<import("./schema").UpdatePlan> {
  const candidateSummaries = candidates
    .map((c, i) => {
      const matchLines = c.matches
        .map(
          (m, j) =>
            `  ${j + 1}. "${m.name}" (similarity: ${m.similarity.toFixed(3)})` +
            (m.scheduledAt ? `, scheduledAt: ${m.scheduledAt}` : "") +
            (m.rawTemporal ? `, rawTemporal: ${m.rawTemporal}` : "") +
            (m.firstSeenAt ? `, firstSeenAt: ${m.firstSeenAt}` : ""),
        )
        .join("\n");

      return [
        `Candidate ${i + 1}:`,
        `  Incoming — name: "${c.incomingEntity.name}", kind: ${c.incomingEntity.kind}` +
          (c.incomingEntity.scheduledAt ? `, scheduledAt: ${c.incomingEntity.scheduledAt}` : "") +
          (c.incomingEntity.rawTemporal ? `, rawTemporal: ${c.incomingEntity.rawTemporal}` : ""),
        `  Similar entities already in the graph:`,
        matchLines,
      ].join("\n");
    })
    .join("\n\n");

  // ── Topic-context section ────────────────────────────────────────────────
  let topicContextSection = "";
  if (topicContext && topicContext.existingTopicEntities.length > 0) {
    const incomingLines = topicContext.incomingTemporalEntities
      .map(
        (e) =>
          `  - "${e.name}" (${e.kind})` +
          (e.scheduledAt ? `, scheduledAt: ${e.scheduledAt}` : "") +
          (e.rawTemporal ? `, rawTemporal: ${e.rawTemporal}` : ""),
      )
      .join("\n");

    const existingLines = topicContext.existingTopicEntities
      .map(
        (e) =>
          `  - "${e.name}" (${e.kind})` +
          (e.scheduledAt ? `, scheduledAt: ${e.scheduledAt}` : "") +
          (e.rawTemporal ? `, rawTemporal: ${e.rawTemporal}` : "") +
          (e.todoDescription ? `, todoDescription: ${e.todoDescription}` : ""),
      )
      .join("\n");

    topicContextSection = `
════════════════════════════════════════
TOPIC CONTEXT — Existing graph entities for this topic
════════════════════════════════════════

The incoming message brings these temporal updates:
${incomingLines || "  (none)"}

Existing entities already stored in the graph for this topic:
${existingLines}

For each existing entity above, decide if the incoming temporal update should
propagate to it (e.g. a postponement should update scheduledAt / rawTemporal on
related Events and Todos). Produce an "update" action for any entity that holds
stale scheduling data, or "noop" if no change is warranted.
`;
  }

  const hasCandidates = candidateSummaries.length > 0;

  return planner.invoke(`
You are managing a knowledge graph.
${
  hasCandidates
    ? `
════════════════════════════════════════
ENRICHMENT CANDIDATES
════════════════════════════════════════

${candidateSummaries}

For each candidate choose exactly one action:
• merge   — the incoming entity is the same real-world thing as one existing entity.
             Set incomingName + targetName (the canonical entity to keep).
• update  — an existing entity should have its properties patched with fresher data.
             Set targetName + fields (only include properties that genuinely need updating).
• noop    — the entities are distinct enough; no graph change is needed.
`
    : ""
}
${topicContextSection}
Rules:
- Prefer merge only when you are highly confident the entities refer to the same thing.
- Prefer update when the incoming entity brings new temporal data (scheduledAt / rawTemporal)
  that an existing entity is missing or has stale.
- Default to noop when in doubt.
- Always include a concise reason.
`);
}
