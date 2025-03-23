import { component$, Slot } from "@builder.io/qwik";
import { routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { DB } from "../../../drizzle";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";
import { customerSessionsCreate } from "@polar-sh/sdk/funcs/customerSessionsCreate.js";
import { customerPortalSubscriptionsCancel } from "@polar-sh/sdk/funcs/customerPortalSubscriptionsCancel";
import { customerPortalSubscriptionsUpdate } from "@polar-sh/sdk/funcs/customerPortalSubscriptionsUpdate.js";
import { SyncCustomer } from "~/server";

declare module "@builder.io/qwik-city" {
  interface EnvGetter {
    get(key: "POLAR_ID_TEST"): string;
    get(key: "POLAR_ID_PROD"): string;
    get(key: "APP_URL"): string;
    get(key: "POLAR_PRODUCT_PRICE_ID"): string;
    get(key: "NODE_ENV"): string;
  }
}
export const useProfile = routeLoader$(async ({ sharedMap }) => {
  const db = DB();
  const session = await sharedMap.get("session");
  if (!session?.user?.email) return null;
  return await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });
});

export const useCheckout = routeAction$(async ({ email }, { env }) => {
  try {
    const polar = new PolarCore({
      accessToken:
        env.get("NODE_ENV") === "production"
          ? env.get("POLAR_ID_PROD")
          : env.get("POLAR_ID_TEST"),
      server: env.get("NODE_ENV") === "production" ? "production" : "sandbox",
    });

    const db = DB();
    await db
      .update(users)
      .set({ lastSyncDate: null })
      .where(eq(users.email, email as string))
      .run();

    const checkout = await checkoutsCreate(polar, {
      productPriceId: env.get("POLAR_PRODUCT_PRICE_ID") as string,
      customerEmail: email as string,
      customerExternalId: email as string,
      successUrl: env.get("POLAR_SUCCESS_URL") as string,
      allowDiscountCodes: true,
    });

    if (!checkout.ok) throw checkout.error;
    return checkout.value.url;
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("redirect"))) {
      console.error("Failed to create checkout:", error);
      throw error;
    }
  }
});

export const useResumeSubscription = routeAction$(
  async (_, { env, sharedMap }) => {
    const polar = new PolarCore({
      accessToken:
        env.get("NODE_ENV") === "production"
          ? env.get("POLAR_ID_PROD")
          : env.get("POLAR_ID_TEST"),
      server: env.get("NODE_ENV") === "production" ? "production" : "sandbox",
    });

    const db = DB();
    const sesh = await sharedMap.get("session");
    if (!sesh?.user?.email) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.email, sesh.user.email),
    });

    if (!user?.polarCustomerId) throw new Error("User not found");

    const session = await customerSessionsCreate(polar, {
      customerId: user.polarCustomerId,
    });

    if (!session.ok) throw session.error;

    const res = await customerPortalSubscriptionsUpdate(
      polar,
      { customerSession: session.value.token },
      {
        id: user.subscriptionId as string,
        customerSubscriptionUpdate: { cancelAtPeriodEnd: false },
      },
    );

    await SyncCustomer(user.email);
    if (!res.ok) throw res.error;
    return res.value;
  },
);

export const useCancelSubscription = routeAction$(
  async (_, { env, sharedMap }) => {
    const polar = new PolarCore({
      accessToken:
        env.get("NODE_ENV") === "production"
          ? env.get("POLAR_ID_PROD")
          : env.get("POLAR_ID_TEST"),
      server: env.get("NODE_ENV") === "production" ? "production" : "sandbox",
    });

    const db = DB();
    const sesh = await sharedMap.get("session");
    if (!sesh?.user?.email) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.email, sesh.user.email),
    });

    if (!user?.polarCustomerId) throw new Error("User not found");

    const session = await customerSessionsCreate(polar, {
      customerId: user.polarCustomerId,
    });

    if (!session.ok) throw session.error;

    const res = await customerPortalSubscriptionsCancel(
      polar,
      { customerSession: session.value.token },
      { id: user.subscriptionId as string },
    );

    await SyncCustomer(user.email);
    if (!res.ok) throw res.error;
    return res.value;
  },
);

export default component$(() => {
  return <Slot />;
});
