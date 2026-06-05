import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { llm } from "@/agents/utils/groq";
import { workerAgentTools } from "./tools";

// ── Agent Setup ──────────────────────────────────────────────────────────────

const agent = createReactAgent({
  llm,
  tools: workerAgentTools,
});

export type WorkerAgentParams = {
  text: string;
  sourceMessageName: string;
  messageCreatedAt: string;
  messageAuthor: string;
};

/**
 * Invoke the background extraction agent to process a message.
 * The agent runs in a ReAct loop, queries the graph, reasons about matches,
 * and calls write tools to mutate the graph.
 */
export async function invokeWorkerAgent(params: WorkerAgentParams): Promise<void> {
  const prompt = `You are a background worker agent for a personal knowledge graph.
Your task is to process an incoming message from Slack or Discord and extract all relevant entities (Topic, Todos, Events, Persons, Projects, Technologies, etc.) and save them in the graph.

Message Metadata:
- Author: ${params.messageAuthor}
- Created At: ${params.messageCreatedAt} (Use this as "now" to resolve relative times like "tomorrow" or "next Friday")
- Source Message Name: ${params.sourceMessageName}

Message Content:
${params.text}

Instructions:
1. Every message MUST have exactly one Topic entity (the overarching subject).
2. Before creating any new entity, ALWAYS query the graph first (using search_entities) to check if an entity with the same name or a semantically similar name already exists in the graph.
3. If the topic already exists, call get_topic_detail to retrieve all its child entities (like existing Todos or Events).
4. If a Todo or Event mentioned in the message already exists in the topic:
   - If the message updates its status (e.g. "completed", "done", "checked off"), call mark_todo_complete.
   - If the message updates its dates or descriptions, call update_entity to modify fields.
5. If the entity does not exist:
   - Call create_entity to create it.
6. When calling create_entity, update_entity, or mark_todo_complete, you MUST pass the 'sourceMessageName' parameter context so it links the current message to that entity in the graph.
7. Be thorough and make sure all entities mentioned in the message are resolved and persisted. Do not stop until all incoming information has been correctly integrated.`;

  await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { recursionLimit: 15 }, // slightly higher limit to allow deep search & update loops
  );
}
