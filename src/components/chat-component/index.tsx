import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";

// Components
export const AiAvatar = component$(() => {
  return (
    <div class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-5 w-5 text-blue-600"
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
      class={`${message.type === "ai" ? "ml-3" : ""} rounded-lg ${message.type === "human" ? "bg-blue-500" : "bg-white"} p-3 shadow-sm`}
    >
      <p class={message.type === "human" ? "text-white" : "text-gray-800"}>
        {message.content}
      </p>
    </div>
  );
});

export const LoadingSpinner = component$(() => {
  return (
    <svg
      class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
  onSubmit$: QRL<(e: Event) => Promise<void>>;
  isRunning: Signal<boolean>;
}>(({ onSubmit$, isRunning }) => {
  return (
    <div class="border-t border-gray-200 bg-white p-4">
      <Form preventdefault:submit onSubmit$={onSubmit$} class="flex space-x-2">
        <input
          type="text"
          name="message"
          placeholder="Type a message..."
          required
          minLength={1}
          autoComplete="off"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          class="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          disabled={isRunning.value}
        >
          {isRunning.value ? (
            <>
              <LoadingSpinner />
              generating...
            </>
          ) : (
            "Send"
          )}
        </button>
      </Form>
    </div>
  );
});
