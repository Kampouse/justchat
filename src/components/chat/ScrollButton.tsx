import { component$, type QRL } from "@builder.io/qwik";

export const ScrollButton = component$<{
  handleScrollToBottom: QRL<() => void>;
}>(({ handleScrollToBottom }) => {
  return (
    <button
      onClick$={handleScrollToBottom}
      class="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-gray-700/90 hover:shadow-xl sm:right-8"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mx-auto h-6 w-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
});
