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
import Drizzler from "../../drizzle";
import { Message } from "~/components/chat/Message";
import { getUser, Session } from ".";
import { tool } from "@langchain/core/tools";
export const TranslationObjectSchema = z.object({
  translation: z.string().describe("the litteral translation").optional(),
  explanation: z.string().describe("grammatical explanation of the translation").optional(),
  pitfall : z.string().describe("A potential pitfall to avoid").optional(),
  grammars : z.array(z.string()).optional().describe("Grammatical rules with translation"),
  pronunciation: z.string().describe("Pronunciation guide").optional(),
  practical: z.object({
     conversation: z.array(z.object({
      person1: z.string().describe("First speaker's line"),
      person1_base: z.string().describe("First speaker's line in the base language"),
    person2: z.string().describe("Second speaker's line"),
    person2_base: z.string().describe("Second speaker's line in the base language"),

    context: z.string().describe("Conversational context").optional()
      })).describe("Example dialogue  easy to follow"),
  })
})
export type LanguageLessonResponse = z.infer<typeof TranslationObjectSchema>;
export const GenerateLanguageLesson = async (input: string) => {
  //@ts-ignore
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5
  }).withStructuredOutput(TranslationObjectSchema);
  const response = await llm.invoke(input);
  return response as LanguageLessonResponse;
};

// Type for structured response




export const BilingualChatSchema = z.object({
  primaryLanguage: z.string().describe("Natural conversational response in the target language, reflecting authentic speech patterns"),
  secondaryLanguage: z.string().describe("Equivalent conversational response in learner's native language, preserving natural flow"),
  context: z.string().describe("Cultural context, pronunciation tips for authentic speaking, and natural dialogue patterns").optional()
});
export type BilingualChatResponse = z.infer<typeof BilingualChatSchema>;

export const AiChat = async (chat: Message[], systemPrompt: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    streaming: true,
  }).withStructuredOutput(BilingualChatSchema);

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
