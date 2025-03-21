import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import { Loading } from "./MessageActions";

export const SendButton = component$<{
  isRunning: Signal<boolean>;
  remaining: number;
}>(({ isRunning, remaining }) => {
  return (
    <button
      type="submit"
      class={`hidden items-center justify-center rounded-full bg-blue-600/90 px-6 py-3 text-base font-medium text-gray-100 backdrop-blur-sm transition-all duration-200 hover:bg-blue-700/90 focus:outline-none focus:ring-2 focus:ring-blue-500/25 sm:flex ${
        remaining <= 0 ? "cursor-not-allowed opacity-50" : ""
      }`}
      disabled={isRunning.value || remaining <= 0}
    >
      {isRunning.value ? <Loading /> : <span>Send</span>}
    </button>
  );
});
