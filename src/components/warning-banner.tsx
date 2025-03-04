import { component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { WarningBannerProps } from "~/types/chat";

export const WarningBanner = component$((props: WarningBannerProps) => {
  const isVisible = useSignal(true);

  return isVisible.value ? (
    <div
      class="fixed left-0 right-0 top-0 z-50 m-4 mx-auto max-w-2xl rounded-lg border border-yellow-600 bg-yellow-100/10 px-4 py-3 text-yellow-200 shadow-lg backdrop-blur-sm transition-all duration-300"
      role="alert"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-3 h-6 w-6 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <strong class="block text-lg font-bold">{props.title}</strong>
            <span class="text-yellow-100/80">{props.message}</span>
          </div>
          <Link
            href="/profile"
            class="rounded-lg px-4 py-2 text-yellow-100/80 transition-colors duration-200 hover:bg-yellow-500/10 hover:text-yellow-500"
          >
            Upgrade
          </Link>
        </div>
        <button
          onClick$={() => (isVisible.value = false)}
          class="ml-4 text-yellow-200 hover:text-yellow-500"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;
});
