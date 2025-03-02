import { component$ } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";
import { useVisibleTask$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { Form } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";
import { useSignal } from "@builder.io/qwik";
import { updateUserLanguage } from "~/server";
import { scrollToBottom } from "~/routes/chat/[id]";

const UpdateUserLanguage = server$(async function (languageCode: string) {
  const session = this.sharedMap.get("session");
  return await updateUserLanguage(session, languageCode);
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
  return (
    <div
      id="message"
      class={`flex ${message.type === "ai" ? "w-full justify-start" : "justify-end"} ${last ? "mb-24" : "mb-6"}`}
    >
      <div
        class={`${
          message.type === "ai"
            ? "prose prose-invert max-w-[85%] rounded-lg bg-gray-900/90 px-6 py-4 shadow-lg backdrop-blur-sm"
            : "max-w-[85%] rounded-2xl bg-blue-700 px-4 py-2 shadow-lg backdrop-blur-sm md:max-w-[75%]"
        }`}
      >
        <p
          class={`${
            message.type === "ai"
              ? "mx-auto max-w-4xl text-lg font-normal leading-relaxed tracking-wide text-gray-50"
              : "text-sm font-medium leading-relaxed text-white md:text-base"
          }`}
        >
          {message.content}
        </p>
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
  useVisibleTask$(() => {
    const chat = document.getElementById("chat");

    console.log(chat);

    const handleScroll = () => {
      isAtBottom.value =
        !chat || chat.scrollTop + chat.clientHeight < chat.scrollHeight - 200;
    };
    chat?.addEventListener("scroll", handleScroll);

    return () => chat?.removeEventListener("scroll", handleScroll);
  });

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
        <div class="mx-auto max-w-3xl px-4 pb-4 pt-2">
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
