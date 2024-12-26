import { Drizzler } from "../../drizzle";
import { schema } from "../../drizzle/schema";
import { ChatOpenAI } from "@langchain/openai";
import { Message } from "~/routes/api";
import { eq } from "drizzle-orm";
export type Session = {
  user: {
    name: string;
    email: string;
    image: string;
    expires: string;
  };
};

export const createUser = async (session: Session) => {
  const db = Drizzler();
  console.log(session.user.email);
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
};
export const getUser = async (ctx: Session | null) => {
  if (ctx) {
    const db = Drizzler();
    return await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, ctx.user.email))
      .execute()
      .then((users) => users[0]);
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
          createdBy: user.id,
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
      return await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.createdBy, user.id))
        .execute();
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
          senderId: user.id,
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
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
    streaming: true,
  });

  const messages = [...history, { role: "user", content: input }];
  const stream = await llm.stream(messages);

  try {
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  } catch (err) {
    console.error("Streaming error:", err);
    throw err;
  }

  // Store the response in history
  history.push({ role: "user", content: input });
  const finalResponse = await llm.invoke(messages);
  history.push({ role: "assistant", content: finalResponse.content });

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
