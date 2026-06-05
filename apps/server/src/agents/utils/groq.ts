import { ChatGroq } from "@langchain/groq";
import { env } from "@second-brain/env/server";
import { ExtractionSchema, UpdatePlanSchema } from "./schema";
import type { EnrichmentCandidate } from "./types";

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
ENTITY KINDS  (assign exactly one per entity)
════════════════════════════════════════

• Topic        — THE umbrella subject the message is primarily about.
                 Think of it as the headline: one or two words that name the
                 conversation thread (e.g. "Rust async runtime", "weekend trip planning",
                 "Q3 sprint review"). Every message should produce AT MOST ONE Topic.
                 Other entities (Projects, Events, Todos …) are children of this Topic.

• Todo         — An actionable task or follow-up, either stated explicitly
                 ("I need to …", "don't forget to …", "we should …") or clearly
                 implied ("the report is due Friday" → Todo: submit the report).
                 Extract one Todo per distinct action item.

• Person       — A human mentioned by name or handle (e.g. "Primeagen", "@alice").
• Platform     — A website, service, or app (e.g. "Twitch", "GitHub", "YouTube").
• Technology   — A language, framework, library, or tool (e.g. "Rust", "React", "Docker").
• Project      — A repo, game, product, or named work (e.g. "neovim", "Doom Eternal").
• Organization — A company, community, or team (e.g. "Vercel", "The Primes").
• Location     — A place, city, or region (e.g. "San Francisco", "Europe").
• Event        — A time-bound happening: conference, release, deadline, meeting,
                 submission, or scheduled activity (e.g. "RustConf", "team standup").
• Other        — Anything concrete that doesn't fit the above.

════════════════════════════════════════
FIELDS
════════════════════════════════════════

Every entity:
  name   — canonical name; preserve original capitalisation, no surrounding articles.
  kind   — one of the kinds above.
  topic  — name of the parent Topic entity this entity belongs to.
           • OMIT for the Topic entity itself.
           • OMIT if you cannot identify a clear parent topic.

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
- Produce AT MOST ONE Topic per message. If the message covers multiple unrelated subjects,
  pick the dominant one.
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
 * Given a list of enrichment candidates (each with an incoming entity and
 * its similar matches already in the graph), ask the LLM to decide what
 * should happen: merge two entities, update fields, or do nothing.
 */
export async function generateUpdatePlan(
  candidates: EnrichmentCandidate[],
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

  return planner.invoke(`
You are managing a knowledge graph. For each candidate below, decide the correct action.

${candidateSummaries}

For each candidate choose exactly one action:
• merge   — the incoming entity is the same real-world thing as one existing entity.
             Set incomingName + targetName (the canonical entity to keep).
• update  — an existing entity should have its properties patched with fresher data.
             Set targetName + fields (only include properties that genuinely need updating).
• noop    — the entities are distinct enough; no graph change is needed.

Rules:
- Prefer merge only when you are highly confident the entities refer to the same thing.
- Prefer update when the incoming entity brings new temporal data (scheduledAt / rawTemporal)
  that an existing entity is missing.
- Default to noop when in doubt.
- Always include a concise reason.
`);
}
