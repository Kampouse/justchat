import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {z} from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { trimMessages } from "@langchain/core/messages";
import { Message } from "~/routes/api";
import Drizzler from "../../drizzle";
import { getUser, Session } from ".";
import { tool } from "@langchain/core/tools";


const LanguageLessonSchema = z.object({
  phrase: z.string().describe("The phrase or expression being taught"),
  translation: z.string().describe("Direct translation to English"),
  contextExplanation: z.string().describe("When and how to use this phrase"),
  formalityLevel: z.string().describe("The level of formality (formal/informal/casual)"),
  pronunciation: z.string().describe("Guide on how to pronounce the phrase"),
  alternatives: z.array(z.string()).describe("Alternative ways to express the same meaning"),
  culturalNotes: z.string().describe("Cultural context and usage notes")
});

export type LanguageLessonResponse = z.infer<typeof LanguageLessonSchema>;
export const GenerateLanguageLesson = async (input: string) => {
  //@ts-ignore
  const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.5
  }).withStructuredOutput(LanguageLessonSchema);
  const response = await llm.invoke(input);
  return response as LanguageLessonResponse;
};

// Type for structured response





export const AiChat = async (chat: Message[], systemPrompt: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-4o-2024-08-06",
    temperature: 0.5,
    streaming: true,
  });

const responseFormatterTool = tool(async () => {}, {
  name: "responseFormatter",
  schema: LanguageLessonSchema,
});
  // Trim messages to keep last 10 messages to maintain context without overloading
  const trimmer = trimMessages({
    strategy: "last",
    maxTokens: 20,
    tokenCounter: (msgs) => msgs.length,
  });

  const messageHistory = chat.map((m) => {
    if (m.type === "ai") {
      return new AIMessage(m.content);
    } else {
      return new HumanMessage(m.content);
    }
  });

  // Trim the message history
  const trimmedMessages = await trimmer.invoke(messageHistory);
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
  ]);

  const chain = prompt.pipe(llm);

  return await chain.stream({
    messages: [
      ...trimmedMessages
    ],
  });
};
