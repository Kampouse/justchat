import { component$, useTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { useSignal } from "@builder.io/qwik";
import { getConvos } from "~/server/conversations";
import { useSession } from "~/routes/plugin@auth";
import type { Session } from "~/server/types";

export const useConvos = routeLoader$(async function ({ sharedMap }) {
  const session = sharedMap.get("session") as Session | null;
  return await getConvos(session);
});

export default component$(() => {
  const session = useSession();
  const convosData = useConvos();
  const error = useSignal("");
  const isLoading = useSignal(false);
  const searchQuery = useSignal("");
  const filteredConvos = useSignal(convosData.value);

  useTask$(({ track }) => {
    track(() => searchQuery.value);
    track(() => convosData.value);

    if (searchQuery.value.trim() === "") {
      filteredConvos.value = convosData.value;
    } else {
      const query = searchQuery.value.toLowerCase();
      filteredConvos.value = convosData.value.filter(
        (chat) => chat.name && chat.name.toLowerCase().includes(query),
      );
    }
  });

  return (
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Your Conversations</h1>
        <Link
          href="/"
          prefetch={false}
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>New Chat</span>
        </Link>
      </div>

      {session.value && convosData.value.length > 0 && (
        <div class="mb-4">
          <div class="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery.value}
              onInput$={(e) =>
                (searchQuery.value = (e.target as HTMLInputElement).value)
              }
              class="w-full rounded-lg bg-gray-800 px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {error.value && (
        <div class="mb-4 rounded-lg bg-red-500 p-4 text-white">
          {error.value}
        </div>
      )}

      {!session.value ? (
        <div class="rounded-lg bg-gray-800 p-6 text-center">
          <p class="text-lg text-white">
            Please sign in to view your conversations
          </p>
          <Link
            href="/login"
            class="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in
          </Link>
        </div>
      ) : isLoading.value ? (
        <div class="flex items-center justify-center py-12">
          <div class="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : filteredConvos.value.length === 0 ? (
        <div class="rounded-lg bg-gray-800 p-6 text-center">
          <p class="text-lg text-white">
            {searchQuery.value
              ? "No conversations match your search"
              : "You don't have any conversations yet"}
          </p>
          <Link
            href="/"
            prefetch={false}
            class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>Start Chatting</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </Link>
        </div>
      ) : (
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConvos.value.map((chat) => (
            <Link
              key={chat.uuid}
              prefetch={false}
              href={`/chat/${chat.uuid}`}
              class="hover:bg-gray-750 group block overflow-hidden rounded-lg border-2 border-gray-800 bg-gray-800 p-4 transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div class="flex justify-between">
                <h3 class="mb-2 truncate text-lg font-medium text-white group-hover:text-blue-400">
                  {chat.name ?? "Unnamed Conversation"}
                </h3>
              </div>
              <p class="flex items-center gap-2 text-sm text-gray-400">
                {new Date(chat.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                })}
              </p>
              <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-700">
                <div class="h-full w-1/3 rounded-full bg-blue-500 transition-all duration-300 group-hover:w-2/3"></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
