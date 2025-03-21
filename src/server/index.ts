import { PolarCore } from "@polar-sh/sdk/core.js";
import { Message } from "~/components/chat/Message";
import { aiChat, generateLanguageLesson } from "./ai";
import { customersCreate } from "@polar-sh/sdk/funcs/customersCreate.js";
import { customersGetExternal } from "@polar-sh/sdk/funcs/customersGetExternal.js";
import { customersGetState } from "@polar-sh/sdk/funcs/customersGetState.js";
import { subscriptionsGet } from "@polar-sh/sdk/funcs/subscriptionsGet.js";
import { eq } from "drizzle-orm";
import { schema } from "../../drizzle/schema";
import { getUser } from "./users";
import drizzle from "../../drizzle";
import Drizzler from "../../drizzle";

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

export { createUser, getUser } from './users';

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

      return customer;
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
