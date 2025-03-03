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

export const  LanguageLessonSchema = z.object({
  phrase: z.string().describe("The initial phrase").optional(),
  translation: z.string().describe("English translation").optional(),
  pronunciation: z.object({
    IPA: z.string().describe("IPA representation").optional(),
    simplified: z.string().describe("Simplified pronunciation").optional()
  }).optional(),
  grammar: z.object({
      word: z.string().describe("Subject").optional(),
      type: z.string().describe("Part of speech").optional(),
      gender: z.string().describe("Gender").optional(),
      case: z.string().describe("Case").optional(),
      article: z.object({
        type: z.string().describe("Article type").optional(),
        declension: z.string().describe("Declension").optional()
    }).optional(),
    verb: z.object({
      word: z.string().describe("Verb").optional(),
      tense: z.string().describe("Tense").optional(),
      conjugation: z.string().describe("Person and number").optional(),
      infinitive: z.string().describe("Infinitive form").optional(),
      conjugation_pattern: z.record(z.string()).describe("Full conjugation").optional()
    }).optional(),
    content: z.object({
      word: z.string().describe("Object").optional(),
      type: z.string().describe("Part of speech").optional(),
      gender: z.string().describe("Gender").optional(),
      case: z.string().describe("Case").optional(),
      article: z.object({
        type: z.string().describe("Article type").optional(),
        reason: z.string().describe("Usage explanation").optional()
      }).optional()
    }).optional()
  }).optional(),
  sentence_structure: z.object({
    word_order: z.string().describe("Word order").optional(),
    sentence_type: z.string().describe("Sentence type").optional(),
    position_rule: z.string().describe("Position rules").optional()
  }).optional(),
  variations: z.array(z.object({
    formal: z.string().optional(),
    informal: z.string().optional(),
    question: z.string().optional(),
    negative: z.string().optional()
  })).describe("Phrase variations").optional(),
  common_contexts: z.array(z.string()).describe("Usage contexts").optional(),
  cultural_notes: z.string().describe("Cultural context").optional(),
  example_dialogues: z.array(z.object({
    A: z.string().optional(),
    B: z.string().optional(),
    situation: z.string().optional()
  })).describe("Example dialogues").optional()
})
export type LanguageLessonResponse = z.infer<typeof LanguageLessonSchema>;
export const GenerateLanguageLesson = async (input: string) => {
  //@ts-ignore
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5
  }).withStructuredOutput(LanguageLessonSchema);
  console.log("Generating language lesson...");
  const response = await llm.invoke(input);
  console.log(response);
  return response as LanguageLessonResponse;
};

// Type for structured response





export const AiChat = async (chat: Message[], systemPrompt: string) => {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
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
