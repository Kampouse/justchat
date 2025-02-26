import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";

const exampleData = {
  id: 1,
  name: "Example User",
  email: "example@user.com",
  image: "https://via.placeholder.com/150",
  created_at: "2023-01-01",
  updated_at: "2023-12-31",
  queries_remaining: 1000,
  queries_used: 500,
  total_queries: 1500,
};

export const useProfile = routeLoader$(async () => {
  return [exampleData];
});

export default component$(() => {
  const profile = useProfile();

  return (
    <div class="min-h-screen bg-gray-700 p-4 text-white">
      <div class="mx-auto max-w-3xl">
        <h1 class="mb-8 text-3xl font-bold">Profile</h1>

        <div class="rounded-lg bg-gray-800 p-6 shadow-lg">
          <div class="mb-6 flex items-center space-x-4">
            {profile.value[0].image && (
              <img
                src={profile.value[0].image}
                alt="Profile"
                class="h-20 w-20 rounded-full object-cover"
                width={80}
                height={80}
              />
            )}
            <div>
              <h2 class="text-xl font-semibold">{profile.value[0].name}</h2>
              <p class="text-gray-400">{profile.value[0].email}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-md bg-gray-700 p-4">
              <h3 class="mb-2 text-lg font-medium">Account Details</h3>
              <div class="space-y-2">
                <p>
                  <span class="text-gray-400">Member since: </span>
                  {profile.value[0].created_at
                    ? new Date(profile.value[0].created_at).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <span class="text-gray-400">Last updated: </span>
                  {profile.value[0].updated_at
                    ? new Date(profile.value[0].updated_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div class="rounded-md bg-gray-700 p-4">
              <h3 class="mb-2 text-lg font-medium">Query Usage</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Queries Remaining:</span>
                  <span class="font-semibold text-white">
                    {profile.value[0].queries_remaining ?? "Unlimited"}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Total Queries Used:</span>
                  <span class="font-semibold text-white">
                    {profile.value[0].queries_used ?? 0}
                  </span>
                </div>
                <div class="mt-4">
                  <div class="h-2 w-full rounded-full bg-gray-600">
                    <div
                      class="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          ((profile.value[0].queries_used ?? 0) /
                            (profile.value[0].total_queries ?? 100)) *
                            100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center">
              <h3 class="mb-4 text-2xl font-bold">Upgrade to Premium</h3>
              <p class="mb-6 text-gray-200">
                Get unlimited queries, priority support, and exclusive features
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
              <button class="rounded-full bg-white px-8 py-3 font-bold text-purple-600 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl">
                Upgrade Now
              </button>
            </div>
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
