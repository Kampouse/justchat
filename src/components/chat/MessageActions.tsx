import type { Signal } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import Loading from "./loading";
import { GenerateLesson } from "../chat";
export default component$<{
  message: { content: string };
  isLoading: Signal<boolean>;
  lessonData: Signal<any>;
  isLessonModalOpen: Signal<boolean>;
}>(({ message, isLoading, lessonData, isLessonModalOpen }) => {
  return (
    <div class="mt-2 flex justify-end space-x-2">
      <button
        onClick$={async () => {
          await navigator.clipboard.writeText(message.content);
          const button = document.activeElement as HTMLButtonElement;
          button.classList.add("scale-90", "opacity-50");
          setTimeout(() => {
            button.classList.remove("scale-90", "opacity-50");
          }, 200);
        }}
        class="inline-flex items-center space-x-1 rounded-md bg-blue-600/20 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-600/30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-4 w-4"
        >
          <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
          <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
        </svg>
        <span>Copy</span>
      </button>
      <button
        onClick$={async () => {
          if (!isLoading.value) {
            isLoading.value = true;
            try {
              lessonData.value = await GenerateLesson(message.content);
              isLessonModalOpen.value = true;
            } catch (error) {
              console.error("Failed to generate lesson:", error);
            } finally {
              isLoading.value = false;
            }
          }
        }}
        class="inline-flex items-center space-x-1 rounded-md bg-blue-600/20 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-600/30"
        disabled={isLoading.value || lessonData.value != null}
      >
        {isLoading.value ? (
          <Loading />
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Analyze</span>
          </>
        )}
      </button>
    </div>
  );
});
