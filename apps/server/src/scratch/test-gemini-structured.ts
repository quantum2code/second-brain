import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "@second-brain/env/server";
import { ExtractionSchema } from "../agents/utils/schema";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: env.GOOGLE_API_KEY,
  temperature: 0,
});

async function main() {
  const extractor = model.withStructuredOutput(ExtractionSchema);
  const res = await extractor.invoke("yo Priya, please finish the database migration by next Wednesday");
  console.log("Structured Response:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
