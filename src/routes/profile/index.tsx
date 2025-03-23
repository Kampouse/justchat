import { Form } from "@builder.io/qwik-city";
import { component$ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { DB } from "../../../drizzle";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  useCancelSubscription,
  useResumeSubscription,
  useCheckout,
} from "./layout";
import { useSignOut } from "~/routes/plugin@auth";
import { GetRemainingQueries } from "~/server/users";

export const useProfile = routeLoader$(async ({ sharedMap }) => {
  const db = DB();

  const session = await sharedMap.get("session");
  await GetRemainingQueries(session);
  if (!session?.user?.email) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  return user;
});

export default component$(() => {
  const user = useProfile();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();
  const nav = useNavigate();
  const logout = useSignOut();

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
        <div class="mb-4 flex items-center">
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

          <button
            onClick$={async () => {
              await logout.submit({});
            }}
            class="ml-auto flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>

        <div class="rounded-lg bg-gray-800 p-6 shadow-lg">
          <div class="mb-6 flex items-center space-x-4">
            <div>
              <h2 class="text-xl font-semibold">{user.value.name}</h2>
              <p class="text-gray-400">{user.value.email}</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="rounded-md bg-gray-700 p-4">
              <h3 class="mb-2 text-lg font-medium">Query Usage</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Monthly Queries:</span>
                  <span class="font-semibold text-white">
                    {user.value.queriesUsed ?? 0} /{" "}
                    {user.value.subscription === "active" ? "500" : "100"}
                  </span>
                </div>
                <div class="mt-2">
                  <div class="h-2 w-full rounded-full bg-gray-600">
                    <div
                      class="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          ((user.value.queriesUsed ?? 0) /
                            (user.value.subscription === "active"
                              ? 500
                              : 100)) *
                            100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p class="mt-1 text-xs text-gray-400">
                    {user.value.subscription === "active"
                      ? `${500 - (user.value.queriesUsed ?? 0)} queries remaining this month`
                      : `${100 - (user.value.queriesUsed ?? 0)} free queries remaining`}
                  </p>
                </div>
              </div>
            </div>

            {!user.value.subscriptionId ? (
              <div class="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <h3 class="text-2xl font-bold">Premium Plan</h3>
                    <p class="text-gray-200">$4.99/month</p>
                  </div>
                </div>
                <ul class="mb-6 space-y-2">
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
                    500 Monthly Queries
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
                </ul>
                <Form
                  action={checkout}
                  onSubmitCompleted$={(data) => {
                    window.location.href = data.detail.value as string;
                  }}
                >
                  <input type="hidden" name="email" value={user.value.email} />
                  <button
                    type="submit"
                    class="w-full rounded-lg bg-white px-6 py-3 text-center font-bold text-purple-600 shadow-lg transition-all hover:bg-gray-100"
                  >
                    Upgrade Now
                  </button>
                </Form>
              </div>
            ) : (
              <div class="rounded-lg bg-gray-700 p-6">
                <div class="mb-4">
                  <h3 class="text-lg font-medium">Subscription Status</h3>
                  {user.value.subscriptionEndDate ? (
                    <>
                      <p class="text-yellow-400">
                        Active until{" "}
                        {new Date(
                          user.value.subscriptionEndDate,
                        ).toLocaleDateString()}
                      </p>

                      <Form action={resumeSubscription} class="mt-4">
                        <button
                          type="submit"
                          class="relative w-full rounded-lg bg-green-500 px-4 py-2 font-medium transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={resumeSubscription.isRunning}
                        >
                          {resumeSubscription.isRunning ? (
                            <div class="flex items-center justify-center">
                              <svg
                                class="h-5 w-5 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  class="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  stroke-width="4"
                                ></circle>
                                <path
                                  class="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span class="ml-2">Resuming...</span>
                            </div>
                          ) : (
                            "Resume Subscription"
                          )}
                        </button>
                      </Form>
                    </>
                  ) : (
                    <>
                      <p class="text-green-400">Active</p>
                      <p class="text-sm text-gray-400">
                        Next payment:{" "}
                        {new Date(
                          user.value.nextPaymentDate || "",
                        ).toLocaleDateString()}
                      </p>
                      <Form action={cancelSubscription} class="mt-4">
                        <button
                          type="submit"
                          class="relative w-full rounded-lg border border-gray-500 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={cancelSubscription.isRunning}
                        >
                          {cancelSubscription.isRunning ? (
                            <div class="flex items-center justify-center">
                              <svg
                                class="h-5 w-5 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  class="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  stroke-width="4"
                                ></circle>
                                <path
                                  class="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span class="ml-2">Canceling...</span>
                            </div>
                          ) : (
                            "Cancel Subscription"
                          )}
                        </button>
                      </Form>
                    </>
                  )}
                </div>
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
