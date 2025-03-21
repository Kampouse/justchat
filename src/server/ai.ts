import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { trimMessages } from "@langchain/core/messages";
import {z} from "zod";
import { Message } from "~/components/chat/Message";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

// Schema definitions
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
    })).describe("Example dialogue easy to follow"),
  })
});

export const BilingualChatSchema = z.object({
  primaryLanguage: z.string().describe("Natural conversational response in the target language"),
  secondaryLanguage: z.string().describe("Equivalent conversational response in learner's native language"),
  context: z.string().describe("Cultural context and pronunciation tips").optional()
});

export type LanguageLessonResponse = z.infer<typeof TranslationObjectSchema>;
export type BilingualChatResponse = z.infer<typeof BilingualChatSchema>;

export const generateLanguageLesson = async (input: string): Promise<LanguageLessonResponse> => {
  const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.5
  }).withStructuredOutput(TranslationObjectSchema);
  
  return await llm.invoke(input);
};

export const aiChat = async (chat: Message[], systemPrompt: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    streaming: true,
  }).withStructuredOutput(BilingualChatSchema);

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