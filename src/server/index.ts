import { Message } from "~/components/chat/Message";
import { eq } from "drizzle-orm";
import { aiChat, generateLanguageLesson } from "./ai";
import { getUser } from "./users";
import Drizzler from "../../drizzle";
import { schema } from "../../drizzle/schema";
export { SyncCustomer } from './polar';
export { createUser, getUser } from './users';
export type Session = {
  user: {
    name: string;
    email: string;
    image: string;
    expires: string;
  };
} | null;




export type StreamableParams = {
  input: string;
  history?: Message[];
  systemPrompt?: string;
}

export async function* streamableResponse(params: StreamableParams) {
  const { input, history = [], systemPrompt = "You're a stressful French assistant that only answers in French" } = params;

  const data = await aiChat([
    ...history,
    { type: "human", content: input }
  ], params.systemPrompt ?? systemPrompt);

  for await (const response of data) {
    const { context, primaryLanguage, secondaryLanguage } = response;

    yield {
      context,
      primaryLanguage,
      secondaryLanguage,
    };
  }

  return history;
}

export type ChatTitleParams = {
  messages: Message[];
  model?: string;
  temperature?: number;
}



export const GenerateLanguageLesson = async (ctx: Session, message: string) => {
  if (!ctx) throw new Error("No session provided");
  if (!message) throw new Error("No message provided");

  const userId = await getUser(ctx);
  if (!userId || !userId[0]) throw new Error("Invalid user");

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id),
  });

  if (!user) throw new Error("User not found");

  try {
    const content = await generateLanguageLesson(message);
    return content;
  } catch (error) {
    console.error('Error generating language lesson:', error);
    throw error;
  }
};
