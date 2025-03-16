import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useProfile, useSubscription, useCheckout, useCancelSubscription, useResumeSubscription } from "./layout";



export default component$(() => {
  const user = useProfile();
  useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();
  const nav = useNavigate();

  if (!user.value) {
    return (
      <div class="grid min-h-screen place-items-center bg-gray-700 text-white">
        <p class="text-lg">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-700 px-4 py-8 text-white">
      <div class="mx-auto max-w-4xl">
        <div class="mb-8 flex items-center justify-between">
          <h1 class="text-3xl font-bold text-white">Settings</h1>
          <button
            onClick$={() => nav("/")}
            class="flex items-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
            </svg>
            <span>Back to Chat</span>
          </button>
        </div>

        <div class="space-y-6 rounded-xl bg-gray-600 p-6">
          <div class="flex items-center justify-between border-b border-gray-500 pb-6">
            <div>
              <h2 class="text-2xl font-bold">{user.value.name}</h2>
              <p class="text-sm text-gray-300">{user.value.email}</p>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-4 rounded-lg bg-gray-600 p-6">
              <h3 class="font-medium text-white">Usage</h3>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-300">Available Queries</span>
                <span class="font-mono text-lg font-medium">
                  {user.value.subscription === "active"
                    ? "∞"
                    : user.value.queriesRemaining}
                </span>
              </div>
              {user.value.subscription !== "active" && (
                <div class="mt-2">
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-500">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((user.value.queriesUsed ?? 0) /
                            (user.value.totalQueries ?? 100)) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {!user.value.subscriptionId ? (
              <div class="relative overflow-hidden rounded-lg bg-gray-600 p-8">
                <div class="relative space-y-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-2xl font-bold text-white">
                        Premium Plan
                      </h3>
                      <p class="mt-1 text-sm text-gray-300">
                        Take your experience to the next level
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 px-6 py-2 shadow-lg ring-1 ring-blue-500/50">
                        <span class="text-xl font-bold tracking-tight text-blue-400">
                          $9.99
                        </span>
                        <span class="text-sm font-medium text-blue-300">
                          month
                        </span>
                      </div>
                    </div>
                  </div>

                  <ul class="space-y-4">
                    <li class="flex items-center space-x-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                        <svg
                          class="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                      <span class="text-base font-medium text-gray-200">
                        Unlimited AI Queries
                      </span>
                    </li>
                    <li class="flex items-center space-x-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                        <svg
                          class="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                      <span class="text-base font-medium text-gray-200">
                        Priority Support
                      </span>
                    </li>
                  </ul>

                  <div class="mt-8">
                    <Form
                      action={checkout}
                      onSubmitCompleted$={(data) => {
                        window.location.href = data.detail.value as string;
                      }}
                    >
                      <input
                        type="hidden"
                        name="email"
                        value={user.value.email}
                      />
                      <button
                        type="submit"
                        class="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-blue-500/25 active:scale-[0.98]"
                      >
                        <div class="relative z-10 flex items-center justify-center">
                          <span>Upgrade Now</span>
                          <svg
                            class="ml-2 h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            ) : (
              <div class="space-y-4 rounded-lg bg-gray-600 p-6">
                <h3 class="font-medium text-white">Subscription</h3>
                {user.value.subscriptionEndDate ? (
                  <>
                    <p class="text-sm text-yellow-400">
                      Active until{" "}
                      {new Date(
                        user.value.subscriptionEndDate,
                      ).toLocaleDateString()}
                    </p>
                    <Form action={resumeSubscription}>
                      <button
                        type="submit"
                        class="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                      >
                        Resume Subscription
                      </button>
                    </Form>
                  </>
                ) : (
                  <>
                    <p class="text-sm text-gray-300">
                      Next payment on{" "}
                      {new Date(
                        user.value.nextPaymentDate || "",
                      ).toLocaleDateString()}
                    </p>
                    <Form
                      action={cancelSubscription}
                      onSubmitCompleted$={() => window.location.reload()}
                    >
                      <button
                        type="submit"
                        class="w-full rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-500"
                      >
                        Pause Subscription
                      </button>
                    </Form>
                  </>
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
  title: "Settings",
  meta: [
    { name: "description", content: "Manage your subscription and features" },
  ],
};
