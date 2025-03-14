import { component$ } from "@builder.io/qwik";
import { customerPortalSubscriptionsCancel } from "@polar-sh/sdk/funcs/customerPortalSubscriptionsCancel";
import { customerPortalSubscriptionsUpdate } from "@polar-sh/sdk/funcs/customerPortalSubscriptionsUpdate.js";
import { Form } from "@builder.io/qwik-city";
import { routeAction$ } from "@builder.io/qwik-city";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { DB } from "../../../drizzle";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";
import { customerSessionsCreate } from "@polar-sh/sdk/funcs/customerSessionsCreate.js";
import { server$ } from "@builder.io/qwik-city";
import { SyncCustomer } from "~/server";

export const useProfile = routeLoader$(async ({ sharedMap }) => {
  const db = DB();
  const session = await sharedMap.get("session");

  if (!session?.user?.email) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  return user;
});

export const useCheckout = routeAction$(async (data, { env }) => {
  try {
    console.log(data);
    const polar = new PolarCore({
      accessToken: env.get("POLAR_ID_TEST"),
      server: "sandbox",
    });
    const checkout = await checkoutsCreate(polar, {
      productPriceId: "177eb451-3f8d-413b-9a9f-6bd3084c1515",
      customerEmail: data.email as string,
      customerExternalId: data.email as string,
      successUrl: `http://localhost:5173/upgrade?success=true`,
      allowDiscountCodes: true,
      customerBillingAddress: {
        country: "CA",
      },
    });

    if (!checkout.ok) {
      throw checkout.error;
    }
    return checkout.value.url;
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("redirect"))) {
      console.error("Failed to create checkout:", error);
      throw error;
    }
  }
});

export const useResumeSubscription = routeAction$(
  async (data, { env, sharedMap }) => {
    const polar = new PolarCore({
      accessToken: env.get("POLAR_ID_TEST"),
      server: "sandbox",
    });

    const db = DB();
    const sesh = await sharedMap.get("session");

    if (!sesh?.user?.email) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, sesh.user.email),
    });

    if (!user || !user.polarCustomerId) {
      throw new Error("User not found");
    }

    const session = await customerSessionsCreate(polar, {
      customerId: user.polarCustomerId as string,
    });

    if (!session.ok) {
      throw session.error;
    }

    const res = await customerPortalSubscriptionsUpdate(
      polar,
      {
        customerSession: session.value.token,
      },
      {
        id: user.subscriptionId as string,
        customerSubscriptionUpdate: {
          cancelAtPeriodEnd: false,
        },
      },
    );

    await SyncCustomer(user.email);

    if (!res.ok) {
      throw res.error;
    }

    return res.value;
  },
);

export const useSubscription = routeLoader$(async (ctx) => {
  const sesh = await ctx.sharedMap.get("session");
  return await SyncCustomer(sesh.user.email);
});
export const useCancelSubscription = routeAction$(
  async (data, { env, sharedMap }) => {
    const polar = new PolarCore({
      accessToken: env.get("POLAR_ID_TEST"),
      server: "sandbox",
    });

    const db = DB();
    const sesh = await sharedMap.get("session");

    if (!sesh?.user?.email) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, sesh.user.email),
    });

    if (!user || !user.polarCustomerId) {
      throw new Error("User not found");
    }
    const session = await customerSessionsCreate(polar, {
      customerId: user.polarCustomerId as string,
    });
    if (!session.ok) {
      throw session.error;
    }
    console.log("session", session);
    const res = await customerPortalSubscriptionsCancel(
      polar,
      {
        customerSession: session.value.token,
      },
      {
        id: user.subscriptionId as string,
      },
    );
    await SyncCustomer(user.email);

    if (!res.ok) {
      throw res.error;
    }

    return res.value;
  },
);

export default component$(() => {
  const user = useProfile();
  const customer = useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();

  const nav = useNavigate();

  if (!user.value) {
    return (
      <div class="flex min-h-screen items-center justify-center bg-gray-700 p-4 text-white">
        <p>Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-700 p-4 text-white">
      <div class="mx-auto max-w-3xl">
        <div class="mb-8 flex items-center justify-between">
          <h1 class="text-3xl font-bold">Profile</h1>
          <button
            onClick$={() => nav("/")}
            class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-500"
          >
            <div class="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Back</span>
            </div>
          </button>
        </div>

        <div class="rounded-lg bg-gray-800 p-6 shadow-lg">
          <div class="mb-6 flex items-center space-x-4">
            <div>
              <h2 class="text-xl font-semibold">{user.value.name}</h2>
              <p class="text-gray-400">{user.value.email}</p>
              {user.value.subscription && (
                <div class="mt-2">
                  {user.value.subscriptionPlan && (
                    <>
                      <span class="text-green 400 text-sm">
                        Current Plan: {user.value.subscriptionPlan}
                      </span>
                      <br />
                    </>
                  )}
                  {user.value.subscriptionStartDate && (
                    <>
                      <span class="text-xs text-gray-400">
                        Started:{" "}
                        {new Date(
                          user.value.subscriptionStartDate,
                        ).toLocaleDateString()}
                      </span>
                      <br />
                    </>
                  )}
                  {user.value.nextPaymentDate && (
                    <>
                      <span class="text-xs text-gray-400">
                        Valid until:{" "}
                        {new Date(
                          user.value.nextPaymentDate,
                        ).toLocaleDateString()}
                      </span>
                      <br />
                    </>
                  )}
                  {user.value.subscriptionEndDate && (
                    <span class="text-xs text-gray-400">
                      Cancellation takes effect:{" "}
                      {new Date(
                        user.value.subscriptionEndDate,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-md bg-gray-700 p-4">
              <h3 class="mb-2 text-lg font-medium">Query Usage</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Queries Remaining:</span>
                  <span class="font-semibold text-white">
                    {user.value.subscription === "active"
                      ? "Unlimited"
                      : user.value.queriesRemaining}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Total Queries Used:</span>
                  <span class="font-semibold text-white">
                    {user.value.queriesUsed ?? 0}
                  </span>
                </div>
                {user.value.subscription !== "active" && (
                  <div class="mt-4">
                    <div class="h-2 w-full rounded-full bg-gray-600">
                      <div
                        class="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            ((user.value.queriesUsed ?? 0) /
                              (user.value.totalQueries ?? 100)) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {user.value.subscriptionId == null ? (
              <div class="mt-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center">
                <h3 class="mb-4 text-2xl font-bold">Upgrade to Premium</h3>
                <p class="mb-6 text-gray-200">
                  Get unlimited queries, priority support, and exclusive
                  features
                </p>
                <ul class="mb-6 space-y-2 text-left">
                  <li class="flex items-center">
                    <svg
                      class="mr-2 h-5 w-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Unlimited Queries
                  </li>
                  <li class="flex items-center">
                    <svg
                      class="mr-2 h-5 w-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Priority Support
                  </li>
                  <li class="flex items-center">
                    <svg
                      class="mr-2 h-5 w-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Advanced Features
                  </li>
                </ul>
                <Form
                  action={checkout}
                  onSubmitCompleted$={(data) => {
                    console.log("Checkout result:", data.detail.value);
                    window.location.href = data.detail.value as string;
                  }}
                >
                  <input type="hidden" name="plan" value="advanced" />
                  <input type="hidden" name="email" value={user.value.email} />
                  <button
                    type="submit"
                    class="rounded-full bg-white px-8 py-3 font-bold text-purple-600 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                  >
                    Upgrade Now
                  </button>
                </Form>
              </div>
            ) : (
              <div class="mt-6 rounded-lg bg-gray-700 p-6 text-center">
                <h3 class="mb-4 text-xl font-bold">Subscription Management</h3>
                <p class="text-gray-300">
                  {!user.value.subscriptionEndDate && (
                    <>
                      Next payment:{" "}
                      {new Date(
                        user.value.nextPaymentDate || "",
                      ).toLocaleDateString()}
                    </>
                  )}
                </p>
                {user.value.subscriptionEndDate ? (
                  <div>
                    <Form
                      action={resumeSubscription}
                      onSubmitCompleted$={() => {
                        window.location.reload();
                      }}
                    >
                      <button
                        type="submit"
                        class="mt-4 rounded-full bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600"
                      >
                        Resume Subscription
                      </button>
                    </Form>
                    <p class="mt-2 text-sm text-gray-400">
                      Resume your subscription to continue uninterrupted service
                    </p>
                  </div>
                ) : (
                  <Form
                    action={cancelSubscription}
                    onSubmitCompleted$={() => {
                      window.location.reload();
                    }}
                  >
                    <input
                      type="hidden"
                      name="subscriptionId"
                      value={user.value.subscription}
                    />
                    <button
                      type="submit"
                      class="mt-4 rounded-full bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600"
                    >
                      Cancel Subscription
                    </button>
                  </Form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Profile - Just Chat",
  meta: [
    {
      name: "description",
      content: "User profile page",
    },
  ],
};
