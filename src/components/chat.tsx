import { component$, useOnDocument, useTask$ } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";
import { server$, useLocation } from "@builder.io/qwik-city";
import Loading from "./chat/loading";
import { Form } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";
import { useSignal } from "@builder.io/qwik";
import MessageActions from "./chat/MessageActions";
import Lesson from "./chat/Lesson";
import type { TranslationObjectSchema } from "~/server/ai";
import { updateUserLanguage, generateLanguageLesson } from "~/server";

// Server Functions
const UpdateUserLanguage = server$(async function (languageCode: string) {
  const session = this.sharedMap.get("session");
  return await updateUserLanguage(session, languageCode);
});

export const GenerateLesson = server$(async function (message: string) {
  const session = this.sharedMap.get("session");
  return await generateLanguageLesson(session, message);
});

// Types & Interfaces
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export type Message = {
  id?: string;
  content: string;
  type: string;
};

// Utils
export const scrollToBottom = () => {
  const chatContainer = document.getElementById("chat");
  if (chatContainer) {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
  }
};

// Constants
export const languages: Language[] = [
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

// Sub-components
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

// Props Interface
export interface ChatInputProps {
  reset?: QRL<(e: Event) => void>;
  onSubmit$: QRL<(e: Event) => Promise<void>>;
  messages: number;
  remaining: number;
  isMenuOpen: Signal<boolean>;
  language: Signal<Language>;
  isRunning: Signal<boolean>;
}

// Chat Input Component
export const ChatInput = component$<ChatInputProps>((props) => {
  const { onSubmit$, isRunning, remaining, language } = props;
  const selectedLanguage = useSignal<Language>(
    languages.find((lang) => lang.code === language.value.code) || languages[0],
  );
  const isAtBottom = useSignal(true);

  const scrollToB = $(() => {
    scrollToBottom();
  });

  useOnDocument(
    "DOMContentLoaded",
    $(() => {
      const chat = document.getElementById("chat");
      if (chat) {
        isAtBottom.value =
          chat.scrollTop + chat.clientHeight < chat.scrollHeight - 200;
      }
    }),
  );

  return (
    <>
      {!props.isMenuOpen.value && isAtBottom.value && (
        <button
          onClick$={scrollToB}
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
      )}

      <div class="fixed bottom-0 left-0 right-0 mx-2 rounded-full border border-transparent backdrop-blur-md sm:left-72 sm:mx-4 md:mx-8 lg:mx-32">
        <div class="mx-auto max-w-3xl px-4 py-2 pb-3">
          <Form
            preventdefault:submit
            onSubmit$={onSubmit$}
            class="mx-auto flex max-w-2xl items-center justify-center space-x-2"
          >
            <div class="flex w-full justify-center space-x-2">
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
                class={`w-full rounded-full border border-gray-700/50 bg-gray-800/50 px-6 py-3 text-base text-gray-100 placeholder-gray-400 backdrop-blur-sm transition-colors duration-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/25 ${remaining <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
              />
              <button
                type="submit"
                class={`hidden items-center justify-center rounded-full bg-blue-600/90 px-6 py-3 text-base font-medium text-gray-100 backdrop-blur-sm transition-all duration-200 hover:bg-blue-700/90 focus:outline-none focus:ring-2 focus:ring-blue-500/25 sm:flex ${remaining <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
                disabled={isRunning.value || remaining <= 0}
              >
                {isRunning.value ? <Loading /> : <span>Send</span>}
              </button>

              <div class="group relative">
                <button
                  name="language"
                  class="flex items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/50 p-3 text-gray-100 backdrop-blur-sm transition-colors duration-200 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <span class="text-lg leading-none">
                    {selectedLanguage.value.flag}
                  </span>
                </button>

                <div class="absolute bottom-full right-0 z-10 hidden min-w-[140px] rounded-xl border border-gray-700/50 bg-gray-800/90 py-2 shadow-lg backdrop-blur-sm group-hover:block">
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      class="cursor-pointer px-4 py-1.5 text-sm text-gray-100 transition-colors duration-150 hover:bg-gray-700/50"
                      onClick$={async () => {
                        selectedLanguage.value = lang;
                        props.language.value = lang;
                        await UpdateUserLanguage(lang.code);
                      }}
                    >
                      <span>
                        {lang.flag} {lang.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
});
