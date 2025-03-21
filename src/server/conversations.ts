import { eq, desc } from "drizzle-orm";
import { conversations, messages } from "../../drizzle/schema";
import Drizzler from "../../drizzle";
import { server$ } from "@builder.io/qwik-city";
import { sql } from "drizzle-orm";
import type { Session } from "./types";
import type { Message } from "~/components/chat/Message";
import { getUser } from "./users";
import { ChatOpenAI } from "@langchain/openai";

export const createConvo = async (ctx: Session | null, uuid: string) => {
  if (!ctx) return;

  const user = await getUser(ctx);
  if (!user?.[0]) return;

  const db = Drizzler();
  const conversation = await db
    .insert(conversations)
    .values({
      name: ctx.user.email,
      createdAt: new Date(),
      uuid,
      createdBy: user[0].id,
    })
    .returning()
    .execute();

  return conversation[0];
};

export const getConvoByUuid = async ({ ctx, uuid }: { ctx: Session | null; uuid: string }) => {
  if (!ctx) return;

  const db = Drizzler();
  const results = await db
    .select()
    .from(conversations)
    .where(eq(conversations.uuid, uuid))
    .limit(1)
    .execute();

  return results[0];
};

export const getAllMessages = async ({ ctx, uuid }: { ctx: Session | null; uuid: string }) => {
  if (!ctx) return;

  const conv = await getConvoByUuid({ ctx, uuid });
  if (!conv) return;

  const db = Drizzler();
  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .execute();
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
  if (!ctx) return;

  const user = await getUser(ctx);
  const conv = await getConvoByUuid({ ctx, uuid });
  if (!user?.[0] || !conv) return;

  const db = Drizzler();
  const messageData = convo.map(e => ({
    conversationId: conv.id,
    senderId: user[0].id,
    content: e.content,
    type: e.type,
    createdAt: new Date(),
  }));

  return await db
    .insert(messages)
    .values(messageData)
    .returning()
    .execute();
};

export const getConvos = async (ctx: Session | null) => {
  if (!ctx) return [];

  const user = await getUser(ctx);
  if (!user || user.length === 0) return [];

  const db = Drizzler();
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.createdBy, user[0].id))
    .orderBy(desc(conversations.createdAt))
    .execute();
};

export const GetConvos = server$(async (ctx: Session | null, start: number, end: number) => {
  if (!ctx) return { data: [], total: 0 };

  const user = await getUser(ctx);
  if (!user || user.length === 0) return { data: [], total: 0 };

  const db = Drizzler();
  const data = await db
    .select()
    .from(conversations)
    .where(eq(conversations.createdBy, user[0].id))
    .orderBy(desc(conversations.createdAt))
    .limit(end)
    .offset(start)
    .execute();

  const count = await db
    .select({ count: sql`count(*)` })
    .from(conversations)
    .where(eq(conversations.createdBy, user[0].id))
    .execute();

  return {
    data,
    total: Number(count[0].count)
  };
});

export const deleteConvoById = async (ctx: Session | null, uuid: string) => {
  if (!ctx) throw new Error("No session provided");

  const db = Drizzler();
  const conversation = await getConvoByUuid({ ctx, uuid });

  if (!conversation) throw new Error("Conversation not found");

  const user = await getUser(ctx);
  if (!user || !user[0]) throw new Error("User not found");

  if (conversation.createdBy !== user[0].id) {
    throw new Error("Unauthorized to delete this conversation");
  }

  await db
    .delete(messages)
    .where(eq(messages.conversationId, conversation.id))
    .execute();

  const deleted = await db
    .delete(conversations)
    .where(eq(conversations.id, conversation.id))
    .returning()
    .execute();

  return deleted[0];
};

export const createChatTitle = async ({
  messages,
  model = "gpt-3.5-turbo",
  temperature = 0.5
}: {
  messages: Message[];
  model?: string;
  temperature?: number;
}) => {
  if (messages.length === 0) return "Empty chat";

  const llm = new ChatOpenAI({ model, temperature });
  const firstMessage = messages
    .slice(0, 1)
    .map(m => `${m.type}: ${m.content}`)
    .join("\n");

  try {
    const response = await llm.invoke(
      `Summarize this chat briefly in 3-4 words based on initial messages:\n${firstMessage}`
    );
    return response.content;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    return null;
  }
};
