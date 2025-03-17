import { component$, useOnDocument, useTask$ } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";
import { server$, useLocation } from "@builder.io/qwik-city";
import { Form } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";
import { useSignal } from "@builder.io/qwik";
import { updateUserLanguage, generateLanguageLesson } from "~/server";
import { scrollToBottom } from "~/routes/chat/[id]";
import type { TranslationObjectSchema } from "~/server/ai";

const UpdateUserLanguage = server$(async function (languageCode: string) {
  const session = this.sharedMap.get("session");
  return await updateUserLanguage(session, languageCode);
});

const GenerateLesson = server$(async function (message: string) {
  const session = this.sharedMap.get("session");
  return await generateLanguageLesson(session, message);
});

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export type Message = {
  id: string;
  text: string;
  role: string;
};

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
// Components
export const AiAvatar = component$(() => {
  return (
    <div class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/50 backdrop-blur-sm">
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
  last: boolean;
}>(({ message, last }) => {
  const isLessonModalOpen = useSignal(false);
  type Language = typeof TranslationObjectSchema._type;
  const lessonData = useSignal<Language | null>(null);
  const isLoading = useSignal(false);
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
        {message.type === "ai" && (
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
                <LoadingSpinner />
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
        )}
        {isLessonModalOpen.value && lessonData.value && (
          <div class="mt-4 border-t border-gray-800/50 pt-4">
            <div class="space-y-6 text-base">
              {lessonData.value.translation && (
                <div class="rounded-lg bg-blue-900/20 p-4 backdrop-blur-sm">
                  <span class="mb-2 block text-lg font-bold text-blue-400">
                    Translation
                  </span>
                  <span class="text-lg text-gray-100">
                    {lessonData.value.translation}
                  </span>
                </div>
              )}

              {lessonData.value.explanation && (
                <div class="rounded-lg bg-purple-900/20 p-4 backdrop-blur-sm">
                  <span class="mb-2 block text-lg font-bold text-purple-400">
                    Explanation
                  </span>
                  <span class="text-lg leading-relaxed text-gray-100">
                    {lessonData.value.explanation}
                  </span>
                </div>
              )}

              {lessonData.value.pitfall && (
                <div class="rounded-lg bg-rose-900/20 p-4 backdrop-blur-sm">
                  <span class="mb-2 block text-lg font-bold text-rose-400">
                    Watch Out!
                  </span>
                  <span class="text-lg leading-relaxed text-gray-100">
                    {lessonData.value.pitfall}
                  </span>
                </div>
              )}

              {lessonData.value.grammars &&
                lessonData.value.grammars.length > 0 && (
                  <div class="rounded-lg bg-emerald-900/20 p-4 backdrop-blur-sm">
                    <span class="mb-3 block text-lg font-bold text-emerald-400">
                      Grammar Rules
                    </span>
                    <div class="space-y-3">
                      {lessonData.value.grammars.map((rule, index) => (
                        <div key={index} class="flex gap-3 text-gray-100">
                          <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                            {index + 1}
                          </span>
                          <span class="text-lg leading-relaxed">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {lessonData.value.pronunciation && (
                <div class="rounded-lg bg-amber-900/20 p-4 backdrop-blur-sm">
                  <span class="mb-2 block text-lg font-bold text-amber-400">
                    Pronunciation Guide
                  </span>
                  <span class="text-lg leading-relaxed text-gray-100">
                    {lessonData.value.pronunciation}
                  </span>
                </div>
              )}

              {lessonData.value.practical.conversation.length > 0 && (
                <div class="rounded-lg bg-indigo-900/20 p-4 backdrop-blur-sm">
                  <span class="mb-3 block text-lg font-bold text-indigo-400">
                    Practice Conversation
                  </span>
                  <div class="divide-y divide-indigo-900/30">
                    {lessonData.value.practical.conversation.map(
                      (conv, index) => (
                        <div
                          key={index}
                          class="space-y-4 py-4 first:pt-0 last:pb-0"
                        >
                          {conv.context && (
                            <div class="mb-3 text-base italic text-indigo-300">
                              {conv.context}
                            </div>
                          )}
                          <div class="space-y-4">
                            <div class="rounded-lg bg-indigo-950/30 p-3">
                              <div class="text-lg font-medium text-gray-100">
                                A: {conv.person1}
                              </div>
                              <div class="mt-1 text-base text-indigo-300">
                                {conv.person1_base}
                              </div>
                            </div>
                            <div class="rounded-lg bg-indigo-950/30 p-3">
                              <div class="text-lg font-medium text-gray-100">
                                B: {conv.person2}
                              </div>
                              <div class="mt-1 text-base text-indigo-300">
                                {conv.person2_base}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const LoadingSpinner = component$(() => {
  return (
    <svg
      class="-ml-1 mr-3 h-4 w-4 animate-spin text-gray-100"
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

export interface ChatInputProps {
  reset?: QRL<(e: Event) => void>;
  onSubmit$: QRL<(e: Event) => Promise<void>>;
  messages: number;
  remaining: number;
  isMenuOpen: Signal<boolean>;
  language: Signal<Language>;
  isRunning: Signal<boolean>;
}

export const ChatInput = component$<ChatInputProps>((props) => {
  const { onSubmit$, isRunning, remaining, language } = props;
  const selectedLanguage = useSignal<Language>(
    languages.find((lang) => lang.code === language.value.code) || languages[0],
  );
  const isAtBottom = useSignal(true);

  const scrollToB = $(() => {
    scrollToBottom();
  });

  // Check if user has scrolled up
  //
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
                {isRunning.value ? <LoadingSpinner /> : <span>Send</span>}
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
