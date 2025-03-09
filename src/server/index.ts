import Drizzler from "../../drizzle";
import type { Signal } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { desc } from "drizzle-orm";
import { schema } from "../../drizzle/schema";
import { ChatOpenAI } from "@langchain/openai";
import { Message } from "~/routes/api";
import { eq } from "drizzle-orm";
import { AiChat, GenerateLanguageLesson } from "./ai";
export type Session = {
  user: {
    name: string;
    email: string;
    image: string;
    expires: string;
  };
} | null;

export const createUser = async (session: Session) => {
  const db = Drizzler();
  if (!session) return;

  try {
    const base = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, session.user.email));

    if (base.length == 0) {
      return await db
        .insert(schema.users)
        .values({
          email: session.user.email,
          name: session.user.name,
        })
        .execute();
    }
    return base;
  } catch (error) {
    console.error("Error creating/fetching user:", error);
    throw error;
  }
};
export const getUser = async (ctx: Session | null) => {
  if (ctx) {
    const db = Drizzler();
    return await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, ctx.user.email))
      .execute();
  }
};
export const updateUserQueries = async (ctx: Session): Promise<boolean> => {
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) throw new Error("Invalid user");

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id),
  });

  if (!user) throw new Error("User not found");

  // Check if queries are exhausted
  if (user.queriesRemaining && user.queriesRemaining <= 0) {
    throw new Error("Query limit exceeded");
  }

  // Update user's query counts
  const updatedUser = await database
    .update(schema.users)
    .set({
      queriesRemaining: (user.queriesRemaining || 0) - 1,
      queriesUsed: (user.queriesUsed || 0) + 1,
    })
    .where(eq(schema.users.id, userId[0].id))
    .returning();
  // Return true if user has remaining queries, otherwise false
  return updatedUser && updatedUser[0] && typeof updatedUser[0].queriesRemaining === 'number' && updatedUser[0].queriesRemaining > 0;
};

export const getRemainingQueries = async (ctx: Session): Promise<number | null> => {
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) return null;

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id)
  });

  if (!user) return null;

  return user.queriesRemaining || 0;
};
export const GetRemainingQueries = async (ctx: Session): Promise<number | null> => {
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) return null;

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id)
  });

  if (!user) return null;

  return user.queriesRemaining || 0;
};


export const createConvo = async (ctx: Session | null, uuid: string): Promise<{
  id: number;
  name: string;
  createdAt: Date;
  uuid: string;
  createdBy: number;
} | undefined> => {
  if (ctx) {
    const user = await getUser(ctx);
    const db = Drizzler();

    if (user && user[0]) {
      const conversation = await db
        .insert(schema.conversations)
        .values({
          name: ctx.user.email,
          createdAt: new Date(),
          uuid: uuid,
          createdBy: user[0].id,
        })
        .returning()
        .execute();

      const result = conversation[0];

      // Type guard to ensure all required properties exist
      if (result &&
          typeof result.id === 'number' &&
          typeof result.name === 'string' &&
          result.createdAt instanceof Date &&
          typeof result.uuid === 'string' &&
          typeof result.createdBy === 'number') {
        return {
          id: result.id,
          name: result.name,
          createdAt: result.createdAt,
          uuid: result.uuid,
          createdBy: result.createdBy
        };
      }
    }
  }
  return undefined;
};
export const getConvoByUuid = async ({
  ctx,
  uuid,
}: {
  ctx: Session | null;
  uuid: string;
}) => {
  if (ctx) {
    const db = Drizzler();
    return await db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.uuid, uuid))
      .limit(1)
      .execute()
      .then((conversations) => conversations[0]);
  }
};

export const getConvos = async (ctx: Session | null) => {
  if (ctx) {
    const user = await getUser(ctx);
    if (!user || user.length == 0) return [];
    const db = Drizzler();
    if (user) {
      const data = await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.createdBy, user[0].id))
        .execute();

      data.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      return data;
    }
  }
};

export const GetConvos = server$( async  (ctx: Session | null, start: Signal<number>, end: Signal<number>) => {
  if (ctx) {
    const user = await getUser(ctx);
    if (!user || user.length == 0) return [];
    const db = Drizzler();
    if (user) {

      const data = await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.createdBy, user[0].id))
        .orderBy(desc(schema.conversations.createdAt))
        .limit(end.value)
        .offset(start.value)
        .execute();

      return data;
    }
  }
  return [];
});

export const getAllMessages = async ({
  ctx,
  uuid,
}: {
  ctx: Session | null;
  uuid: string;
}) => {
  if (ctx) {
    try {
      const conv = await getConvoByUuid({
        ctx: ctx,
        uuid: uuid,
      });

      const db = Drizzler();
      if (conv) {
        return await db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.conversationId, conv.id))
          .execute();
      }
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }
};

export const createMessages = async ({
  ctx,
  convo,
  uuid,
}: {
  ctx: Session | null;
  uuid: string;
  convo: Message[];
}) => {
  if (ctx) {
    const user = await getUser(ctx);
    const conv = await getConvoByUuid({
      ctx: ctx,
      uuid: uuid,
    });

    const db = Drizzler();
    if (user) {
      const convos = convo.map((e) => {
        return {
          conversationId: conv?.id,
          senderId: user[0].id,
          content: e.content,
          type: e.type,
          createdAt: new Date(),
        };
      });

      return await db
        .insert(schema.messages)
        .values(convos)
        .returning()
        .execute();
    }
  }
};
export type StreamableParams = {
  input: string;
  history?: Message[];
  systemPrompt?: string;
}

export async function* streamableResponse(params: StreamableParams) {
  const { input, history = [], systemPrompt = "Your a stressful french assistant. that only anser in french" } = params;

  const data = await AiChat([
    ...history,
    { type: "human", content: input }
  ], params.systemPrompt  ?? "");

  let buffer = [];
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

export const createChatTitle = async ({
  messages,
  model = "gpt-3.5-turbo",
  temperature = 0.5
}: ChatTitleParams) => {
  const llm = new ChatOpenAI({
    model,
    temperature,
  });

  if (messages.length === 0) return "Empty chat";

  const firstMessage = messages
    .slice(0, 1)
    .map((m) => `${m.type}: ${m.content}`)
    .join("\n");

  const prompt = `Summarize this chat briefly in 3-4 words based on initial messages:\n${firstMessage}`;

  try {
    const response = await llm.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    return null;
  }
};
export const updateUserLanguage = async (ctx: Session, language: string): Promise<boolean> => {
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) throw new Error("Invalid user");

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id),
  });

  if (!user) throw new Error("User not found");

  const updatedUser = await database
    .update(schema.users)
    .set({
      language: language
    })
    .where(eq(schema.users.id, userId[0].id))
    .returning();

  return !!updatedUser[0];
};

export const generateLanguageLesson = async (ctx: Session, message: string)  => {
  const userId = await getUser(ctx);
  if (!userId || !userId[0]) throw new Error("Invalid user");

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id),
  });

  if (!user) throw new Error("User not found");

  const remainingQueries = await getRemainingQueries(ctx);
  if (remainingQueries === null || remainingQueries <= 0) {
    throw new Error("No remaining queries");
  }
   await updateUserQueries(ctx);
 const content =   await GenerateLanguageLesson(message)
  return content;
};
