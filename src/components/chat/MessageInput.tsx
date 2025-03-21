import { component$ } from "@builder.io/qwik";

export const MessageInput = component$<{ remaining: number }>(
  ({ remaining }) => {
    return (
      <input
        type="text"
        name="message"
        placeholder={
          remaining <= 0 ? "Query limit reached" : "Type a message..."
        }
        required
        minLength={1}
        autoComplete="off"
        disabled={remaining <= 0}
        class={`w-full rounded-full border border-gray-700/50 bg-gray-800/50 px-6 py-3 text-base text-gray-100 placeholder-gray-400 backdrop-blur-sm transition-colors duration-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/25 ${
          remaining <= 0 ? "cursor-not-allowed opacity-50" : ""
        }`}
      />
    );
  },
);
