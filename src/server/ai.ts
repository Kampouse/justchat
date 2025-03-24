import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { trimMessages } from "@langchain/core/messages";
import { z } from "zod";
import { Message } from "~/components/chat/Message";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { updateUserQueries } from "./users";

// Schema definitions
export const TranslationObjectSchema = z.object({
  translation: z.string().describe("the litteral translation").optional(),
  explanation: z.string().describe("grammatical explanation of the translation").optional(),
  pitfall: z.string().describe("A potential pitfall to avoid").optional(),
  grammars: z.array(z.string()).optional().describe("Grammatical rules with translation"),
  pronunciation: z.string().describe("Pronunciation guide").optional(),
  practical: z.object({
    conversation: z.array(z.object({
      person1: z.string().describe("First speaker's line"),
      person1_base: z.string().describe("First speaker's line in the base language"),
      person2: z.string().describe("Second speaker's line"),
      person2_base: z.string().describe("Second speaker's line in the base language"),
      context: z.string().describe("Conversational context").optional()
    })).describe("Example dialogue easy to follow"),
  })
});
export const BilingualChatSchema = (lang: string) => z.object({
  primaryLanguage: z.string().describe(`Listen to the user's message attentively, then create a thoughtful and culturally sensitive response in ${lang} to foster a meaningful conversation. Reflect on their sentiments, context, and cultural nuances, adapting your reply to their tone and needs. Offer relevant emotions, insights, empathy, or solutions, ensuring your response is a nuanced and authentic adaptation, formatted as requested, and free from translation artifacts. Respect the user's language and culture in tone and content.`),
  secondaryLanguage: z.string().describe("Equivalent conversational response in learner's native language, preserving cultural nuances"),
  context: z.string().describe("Essential cultural context, pronunciation guidance, and usage notes").optional()
});
export type LanguageLessonResponse = z.infer<typeof TranslationObjectSchema>;
export type BilingualChatResponse = {
  primaryLanguage: string;
  secondaryLanguage: string;
  context?: string;
};

export const generateLanguageLesson = async (input: string): Promise<LanguageLessonResponse> => {
  const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.5
  }).withStructuredOutput(TranslationObjectSchema);

  return await llm.invoke(input);
};

export const aiChat = async (chat: Message[], systemPrompt: string, lang: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.3,
    streaming: true,
  }).withStructuredOutput(BilingualChatSchema(lang));

  const trimmer = trimMessages({
    strategy: "last",
    maxTokens: 20,
    tokenCounter: (msgs) => msgs.length,
  });

  const messageHistory = chat.map((m) =>
    m.type === "ai" ? new AIMessage(m.content) : new HumanMessage(m.content)
  );

  const trimmedMessages = await trimmer.invoke(messageHistory);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
  ]);

  return prompt.pipe(llm).stream({
    messages: [...trimmedMessages],
  });
};
