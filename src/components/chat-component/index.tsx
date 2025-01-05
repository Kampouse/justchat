import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";

// Components
export const AiAvatar = component$(() => {
  return (
    <div class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-5 w-5 text-blue-400"
        >
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5z" />
        </svg>
      </div>
    </div>
  );
});

export const Message = component$<{
  message: { type: string; content: string };
}>(({ message }) => {
  return (
    <div
      class={`${message.type === "ai" ? "ml-3" : ""} max-w-md rounded-lg ${message.type === "human" ? "bg-blue-600" : "bg-gray-800"} p-3 shadow-sm`}
    >
      <p class="text-gray-100">{message.content}</p>
    </div>
  );
});

export const LoadingSpinner = component$(() => {
  return (
    <svg
      class="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-100"
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
  );
});

export const ChatInput = component$<{
  reset?: QRL<(e: Event) => void>;
  onSubmit$: QRL<(e: Event) => Promise<void>>;
  messages: number;
  isRunning: Signal<boolean>;
}>(({ onSubmit$, isRunning, messages }) => {
  return (
    <div class="rounded-lg  border-t border-gray-800 bg-gray-900 p-4">
      <Form preventdefault:submit onSubmit$={onSubmit$} class="flex space-x-2">
        <input
          type="text"
          name="message"
          placeholder="Type a message..."
          required
          minLength={1}
          autoComplete="off"
          class="w-full flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none sm:w-3/4 md:w-4/5 lg:w-5/6"
        />
        {messages > 1 && (
          <Link
            class="flex  w-16 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 px-1 text-white hover:bg-gray-800 md:w-24 md:px-4"
            href="/"
          >
            <span class="hidden w-20 px-2 text-center sm:inline">New Chat</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="inline h-5 w-5 sm:hidden"
            >
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span role="img" aria-label="fire" class="hidden sm:inline">
              🔥
            </span>
          </Link>
        )}
        <button
          type="submit"
          class="flex w-28 items-center justify-center rounded-lg bg-blue-600 py-2 text-gray-100 transition-colors duration-500 hover:bg-blue-700"
          disabled={isRunning.value}
        >
          {isRunning.value ? (
            <div class="flex w-5 justify-center transition duration-500">
              <LoadingSpinner />
            </div>
          ) : (
            <h1 class="flex justify-center px-2 text-center">Send</h1>
          )}
        </button>
      </Form>
    </div>
  );
});
