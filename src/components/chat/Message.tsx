import Lesson from "./Lesson";
import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import MessageActions from "./MessageActions";
import type { TranslationObjectSchema } from "~/server/ai";
export type Message = {
  id?: string;
  content: string;
  type: string;
};
const MessageContent = component$<{
  message: { type: string; content: string };
}>(({ message }) => {
  const isLoading = useSignal(false);
  const lessonData = useSignal<any | null>(null);
  const isLessonModalOpen = useSignal(false);
  return (
    <div
      class={`${
        message.type === "ai"
          ? "prose prose-invert max-w-[85%] rounded-lg bg-gray-900/90 px-6 py-4 shadow-lg backdrop-blur-sm"
          : "flex items-center space-x-2 rounded-2xl bg-gradient-to-br from-blue-600/90 to-blue-700/90 px-8 py-3 text-start shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/10"
      }`}
    >
      <div
        class={`${
          message.type === "ai"
            ? "group mx-auto max-w-4xl text-lg font-normal leading-relaxed tracking-wide text-gray-50"
            : "text-sm font-medium leading-relaxed text-white md:text-base"
        } relative`}
      >
        <p>{message.content}</p>
      </div>
      {message.type == "ai" && (
        <MessageActions
          message={message}
          isLoading={isLoading}
          lessonData={lessonData}
          isLessonModalOpen={isLessonModalOpen}
        />
      )}
      {lessonData.value && <Lesson lessonData={lessonData.value} />}
    </div>
  );
});

// Main Components
export const Message = component$<{
  message: { type: string; content: string };
  last: boolean;
}>(({ message, last }) => {
  type Language = typeof TranslationObjectSchema._type;
  const lessonData = useSignal<Language | null>(null);
  const loc = useLocation();
  useTask$((track) => {
    track.track(() => loc.url.pathname);
    lessonData.value = null;
  });

  return (
    <div
      id="message"
      class={`flex ${message.type === "ai" ? "w-full justify-start" : "justify-end"} ${last ? "mb-24" : "mb-6"}`}
    >
      <MessageContent message={message} />
    </div>
  );
});
