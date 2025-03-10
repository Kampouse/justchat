import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { useSignal } from "@builder.io/qwik";
import { getConvos } from "~/server";
import { useSession } from "~/routes/plugin@auth";
import type { Session } from "~/server";
export const useConvos = routeLoader$(async function ({ sharedMap }) {
  const session = sharedMap.get("session") as Session | null;

  return await getConvos(session);
});
export default component$(() => {
  const session = useSession();
  const convosData = useConvos();
  const error = useSignal("");

  return (
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Your Conversations</h1>
        <Link
          href="/"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700"
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
        </div>
      ) : convosData.value.length === 0 ? (
        <div class="rounded-lg bg-gray-800 p-6 text-center">
          <p class="text-lg text-white">You don't have any conversations yet</p>
          <Link
            href="/"
            class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700"
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
          {convosData.value.map((chat) => (
            <Link
              key={chat.uuid}
              href={`/chat/${chat.uuid}`}
              class="group block overflow-hidden rounded-lg border-2 border-gray-800 bg-gray-800 p-4 transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg"
            >
              <h3 class="mb-2 truncate text-lg font-medium text-white group-hover:text-blue-400">
                {chat.name ?? "Unnamed Conversation"}
              </h3>
              <p class="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(chat.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                })}
              </p>
              <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-700">
                <div class="h-full w-1/3 rounded-full bg-blue-500"></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
