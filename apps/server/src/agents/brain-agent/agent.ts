import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { llm } from "@/agents/utils/groq";
import { brainAgentTools } from "./tools";

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a personal knowledge assistant for the user's second brain.

The second brain is a graph database automatically built from the user's Slack and Discord 
conversations. It contains:
  • Topics   — the overarching subjects of conversations
  • Todos    — action items and tasks (may have a due date)
  • Events   — time-bound happenings and deadlines
  • People   — individuals mentioned in conversations
  • Other entities — projects, technologies, organizations, etc.

Your job: help the user query, understand, and manage this knowledge.

Guidelines:
- Always use the tools to look up real data before answering. Never guess what exists.
- When asked about todos or events, always list their scheduled dates and descriptions.
- When updating something, confirm exactly what changed.
- Use search_entities before any write operation to confirm the entity's exact name.
- If a user asks to mark something done or change a date, do it directly — no need to confirm.
- Be concise. Bullet points over long prose.
- If nothing is found for a query, say so clearly and suggest what the user might search for.`;

// ── Agent ─────────────────────────────────────────────────────────────────────

const agent = createReactAgent({
  llm,
  tools: brainAgentTools,
  stateModifier: SYSTEM_PROMPT,
});

// ── Public interface ──────────────────────────────────────────────────────────

export type ToolCallLog = {
  tool: string;
  input: unknown;
  output: string;
};

export type AgentResult = {
  response: string;
  toolCalls: ToolCallLog[];
};

/**
 * Invoke the brain agent with a user message.
 * Runs the ReAct loop (max 10 iterations) and returns the final response
 * along with a log of every tool call made.
 */
export async function invokeBrainAgent(message: string): Promise<AgentResult> {
  const result = await agent.invoke(
    { messages: [new HumanMessage(message)] },
    { recursionLimit: 10 },
  );

  const messages = result.messages as Array<{
    _getType?: () => string;
    content?: unknown;
    tool_calls?: Array<{ name: string; args: unknown }>;
    name?: string;
  }>;

  // Collect tool call logs from the message trace
  const toolCalls: ToolCallLog[] = [];
  let pendingCalls: Array<{ name: string; args: unknown }> = [];

  for (const msg of messages) {
    const type = msg._getType?.();

    if (type === "ai" && msg.tool_calls && msg.tool_calls.length > 0) {
      pendingCalls = msg.tool_calls.map((tc) => ({
        name: tc.name,
        args: tc.args,
      }));
    }

    if (type === "tool") {
      const matched = pendingCalls.find((c) => c.name === msg.name);
      if (matched) {
        toolCalls.push({
          tool: matched.name,
          input: matched.args,
          output: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        });
      }
    }
  }

  // Final AI message is the response
  const lastAiMessage = [...messages]
    .reverse()
    .find((m) => m._getType?.() === "ai");

  const response =
    typeof lastAiMessage?.content === "string"
      ? lastAiMessage.content
      : Array.isArray(lastAiMessage?.content)
        ? (lastAiMessage.content as Array<{ text?: string }>)
            .map((c) => c.text ?? "")
            .join("")
        : "No response generated.";

  return { response, toolCalls };
}
