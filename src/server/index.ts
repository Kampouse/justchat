import Drizzler from "../../drizzle";

import { schema } from "../../drizzle/schema";
import { ChatOpenAI } from "@langchain/openai";
import { Message } from "~/routes/api";
import { eq } from "drizzle-orm";
import { AiChat } from "./ai";
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
export const createConvo = async (ctx: Session | null, uuid: string) => {
  if (ctx) {
    const user = await getUser(ctx);

    const db = Drizzler();
    if (user) {
      return await db
        .insert(schema.conversations)
        .values({
          name: ctx.user.email,
          createdAt: new Date(),
          uuid: uuid,
          createdBy: user[0].id,
        })
        .returning()
        .execute()
        .then((conversations) => conversations[0]);
    }
  }
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
export async function* streamableResponse(input: string, history: any[] = []) {
  const data = await AiChat([...history, { type: "human", content: input }]);

  let buffer = [];
  for await (const response of data) {
    let token = response.content.toString();
    if (token.startsWith(" ") && buffer.length > 0) {
      buffer[buffer.length - 1] += token;
    } else {
      buffer.push(token);
    }
    if (
      token.endsWith(" ") ||
      token.endsWith(".") ||
      token.endsWith("!") ||
      token.endsWith("?")
    ) {
      const content = buffer.join("");
      buffer = [];
      yield content;
    }
  }
  if (buffer.length > 0) {
    yield buffer.join("");
  }

  return history;
}
export const createChatTitle = async (messages: Message[]) => {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
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
