import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { env } from "@second-brain/env/server";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: env.GOOGLE_API_KEY,
  temperature: 0,
});

const myTool = tool(
  async ({ query }) => {
    return `Results for ${query}`;
  },
  {
    name: "search_entities",
    description: "Search for entities in the graph",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

async function main() {
  const modelWithTools = model.bindTools([myTool]);
  const res = await modelWithTools.invoke("Search for 'CA report'");
  console.log("Response:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
