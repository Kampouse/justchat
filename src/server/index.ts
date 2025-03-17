import Drizzler from "../../drizzle";
import {sql} from "drizzle-orm";
import { customersCreate } from "@polar-sh/sdk/funcs/customersCreate.js";
import { customersGetExternal  } from "@polar-sh/sdk/funcs/customersGetExternal.js";
import { subscriptionsGet } from "@polar-sh/sdk/funcs/subscriptionsGet.js";
import { PolarCore } from "@polar-sh/sdk/core.js";
import type { Signal } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { desc } from "drizzle-orm";
import { schema } from "../../drizzle/schema";
import { ChatOpenAI } from "@langchain/openai";
import { Message } from "~/routes/api";
import { eq } from "drizzle-orm";
import { AiChat, GenerateLanguageLesson } from "./ai";
import { customersGetState } from "@polar-sh/sdk/funcs/customersGetState.js";
import drizzle from "../../drizzle";

const TRIAL_MONTHLY_QUERIES = 50;
const PREMIUM_MONTHLY_QUERIES = 500;

export type Session = {
  user: {
    name: string;
    email: string;
    image: string;
    expires: string;
  };
} | null;

const getPolarConfig = (env: string | undefined) => {
  return {
    server: env === 'production' ? 'production' : 'sandbox' as 'production' | 'sandbox',
    accessToken: env === 'production' ? process.env.POLAR_ID_PROD : process.env.POLAR_ID_TEST,
  };
};

export const createUser = async (session: Session) => {
  const db = Drizzler();
  if (!session) return;

  try {
    const base = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, session.user.email));

    if (base.length == 0) {
      // Set initial query count for new users
      return await db
        .insert(schema.users)
        .values({
          email: session.user.email,
          name: session.user.name,
          queriesRemaining: TRIAL_MONTHLY_QUERIES,
          lastQueryReset: new Date(),
          subscriptionStatus: 'none'
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
  if (!ctx) throw new Error("No session provided");

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
  if (!ctx) return null;

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
  if (!ctx) return null;

  const userId = await getUser(ctx);
  if (!userId || !userId[0]) return null;

  const database = Drizzler();
  const user = await database.query.users.findFirst({
    where: eq(schema.users.id, userId[0].id)
  });

  if (!user) return null;
  if (!user.lastSyncDate || (new Date().getTime() - new Date(user.lastSyncDate).getTime() > 24 * 60 * 60 * 1000)) {
    await database.update(schema.users)
      .set({ lastSyncDate: new Date() })
      .where(eq(schema.users.id, userId[0].id)).execute();

    await SyncCustomer(ctx.user.email);
  }

  // Handle query reset logic
  if (user.lastQueryReset) {
    const currentTime = new Date().getTime();
    const lastResetTime = new Date(user.lastQueryReset).getTime();
    const timeDiff = currentTime - lastResetTime;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (timeDiff > thirtyDays) {
      const queryLimit = user.subscriptionStatus === 'active' ? PREMIUM_MONTHLY_QUERIES : TRIAL_MONTHLY_QUERIES;

      await database.update(schema.users)
        .set({
          queriesRemaining: queryLimit,
          lastQueryReset: new Date()
        })
        .where(eq(schema.users.id, userId[0].id));

      return queryLimit;
    }
  }

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
        .orderBy(desc(schema.conversations.createdAt))
        .execute();

      return data;
    }
  }
  return []
};

export const GetConvos = server$( async  (ctx: Session | null, start: Signal<number>, end: Signal<number>) => {
  if (ctx) {
    const user = await getUser(ctx);
    if (!user || user.length == 0) return {
      data: [],
      total: 0
    };
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

      const count = await db
        .select({ count: sql`count(*)` })
        .from(schema.conversations)
        .where(eq(schema.conversations.createdBy, user[0].id))
        .execute();

      return {
        data,
        total: Number(count[0].count)
      };
    }
  }
  return { data: [], total: 0 };
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
  if (!ctx) throw new Error("No session provided");

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

export const SyncCustomer = async (email: string) => {
  if (!email) throw new Error("Email is required");
  const { accessToken, server } = getPolarConfig(process.env.NODE_ENV);
  if (!accessToken) throw new Error("Polar API key not configured");

  const db = drizzle();
  const polar = new PolarCore({
    accessToken,
    server,
  });

  try {
    const cus = await customersGetExternal(polar, {
      externalId: email,
    });
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!cus.ok) {
      console.log("Customer not found in Polar",cus.error.message);
      const customer = await customersCreate(polar, {
        externalId: email,
        email: email,
        name: user[0].name || 'Customer',
      })
      if (!customer.ok) {
        throw new Error("Failed to create customer in Polar");
      }

      await db.update(schema.users)
        .set({
          polarCustomerId: customer.value.id,
          name: customer.value.name || user[0].name,
          subscription: 'none',
          subscriptionStatus: 'none',
          queriesRemaining: TRIAL_MONTHLY_QUERIES
        })
        .where(eq(schema.users.email, email))
        .execute();

      const error = cus.error.name
      return customer
    }

    const customer = await customersGetState(polar, {
      id: cus.value.id
    });

    if (!customer.ok) {
      throw new Error("Failed to fetch customer state from Polar");
    }

    if (!customer.value.activeSubscriptions?.length) {
      // Handle case where customer has no active subscriptions
      await db.update(schema.users)
        .set({
          polarCustomerId: customer.value.id,
          name: customer.value.name,
          subscription: 'none',
          subscriptionStatus: 'none',
          queriesRemaining: TRIAL_MONTHLY_QUERIES
        })
        .where(eq(schema.users.email, email));

      return customer.value;
    }

    const sub = await subscriptionsGet(polar, {
      id: customer.value.activeSubscriptions[0].id
    });

    if (!sub.ok) {
      throw new Error("Failed to fetch subscription details from Polar");
    }

    // Update user record with full customer data
    await db
      .update(schema.users)
      .set({
        polarCustomerId: customer.value.id,
        name: customer.value.name,
        subscription: customer.value.activeSubscriptions[0].status || 'none',
        subscriptionStatus: customer.value.activeSubscriptions[0].status,
        subscriptionPlan: customer.value.activeSubscriptions[0].productId,
        subscriptionId: customer.value.activeSubscriptions[0].id,
        subscriptionStartDate: customer.value.activeSubscriptions[0].startedAt,
        subscriptionEndDate: customer.value.activeSubscriptions[0].endsAt,
        lastPaymentDate: customer.value.activeSubscriptions[0].currentPeriodStart,
        nextPaymentDate: customer.value.activeSubscriptions[0].currentPeriodEnd,
        accountStatus: sub.value.status ?? 'none',
        lastSubscriptionChange: customer.value.activeSubscriptions[0].modifiedAt,
        queriesRemaining: customer.value.activeSubscriptions[0].status === 'active' ? PREMIUM_MONTHLY_QUERIES : TRIAL_MONTHLY_QUERIES
      })
      .where(eq(schema.users.email, email));

    return customer.value;
  } catch (error) {
    console.error('Error syncing customer:', error);
    throw error;
  }
};

export const generateLanguageLesson = async (ctx: Session, message: string)  => {
  if (!ctx) throw new Error("No session provided");
  if (!message) throw new Error("No message provided");

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

  try {
    await updateUserQueries(ctx);
    const content = await GenerateLanguageLesson(message);
    return content;
  } catch (error) {
    console.error('Error generating language lesson:', error);
    throw error;
  }
};
export const deleteConvoById = async (ctx: Session | null, uuid: string) => {
  if (!ctx) throw new Error("No session provided");

  const db = Drizzler();
  const conversation = await getConvoByUuid({ ctx, uuid });

  if (!conversation) throw new Error("Conversation not found");

  const user = await getUser(ctx);
  if (!user || !user[0]) throw new Error("User not found");

  // Verify user owns the conversation
  if (conversation.createdBy !== user[0].id) {
    throw new Error("Unauthorized to delete this conversation");
  }

  // Delete associated messages first
  await db
    .delete(schema.messages)
    .where(eq(schema.messages.conversationId, conversation.id))
    .execute();

  // Delete the conversation
  const deleted = await db
    .delete(schema.conversations)
    .where(eq(schema.conversations.id, conversation.id))
    .returning()
    .execute();

  return deleted[0];
};
