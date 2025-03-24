import { PolarCore } from "@polar-sh/sdk/core.js";
import { customersCreate } from "@polar-sh/sdk/funcs/customersCreate.js";
import { customersGetExternal } from "@polar-sh/sdk/funcs/customersGetExternal.js";
import { customersGetState } from "@polar-sh/sdk/funcs/customersGetState.js";
import { subscriptionsGet } from "@polar-sh/sdk/funcs/subscriptionsGet.js";
import { eq } from "drizzle-orm";
import { schema } from "../../drizzle/schema";
import drizzle from "../../drizzle";

export const TRIAL_MONTHLY_QUERIES = 50;
export const PREMIUM_MONTHLY_QUERIES = 500;

const getPolarConfig = (env: string | undefined) => {
  return {
    server: env === 'production' ? 'production' : 'sandbox' as 'production' | 'sandbox',
    accessToken: env === 'production' ? process.env.POLAR_ID_PROD : process.env.POLAR_ID_TEST,
  };
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
      const customer = await customersCreate(polar, {
        externalId: email,
        email: email,
        name: user[0].name || 'Customer',
      })
      if (!customer.ok) {
        throw new Error("Failed to create customer in Polar");
      }
      return customer;
    }

    const customer = await customersGetState(polar, {
      id: cus.value.id
    });

    if (!customer.ok) {
      throw new Error("Failed to fetch customer state from Polar");
    }

    if (!customer.value.activeSubscriptions?.length) {
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
