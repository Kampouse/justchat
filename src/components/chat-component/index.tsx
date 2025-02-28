import { component$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import type { QRL, Signal } from "@builder.io/qwik";
import { useSignal } from "@builder.io/qwik";

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
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
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
}>(({ message }) => {
  return (
    <div
      class={`${message.type === "ai" ? "ml-3" : ""} max-w-md rounded-lg ${message.type === "human" ? "bg-blue-600" : "bg-gray-800"} p-3 shadow-sm`}
    >
      <p class="text-gray-100">{message.content}</p>
    </div>
  );
});

export const LoadingSpinner = component$(() => {
  return (
    <svg
      class="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-100"
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
  language: Signal<Language>;
  isRunning: Signal<boolean>;
}

export const ChatInput = component$<ChatInputProps>((props) => {
  const { onSubmit$, isRunning, remaining } = props;
  const selectedLanguage = useSignal<Language>(languages[languages.length - 1]);

  return (
    <div class=" flex flex-row rounded-lg  border-t border-gray-800 bg-gray-900 p-4">
      <Form
        preventdefault:submit
        onSubmit$={onSubmit$}
        class="flex flex-1 space-x-2"
      >
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
          class={`h-auto min-h-[40px] w-full flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none ${remaining <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
          style="height: auto; min-height: 40px; resize: vertical;"
        />

        <button
          type="submit"
          class={`flex w-28 items-center justify-center rounded-lg bg-blue-600 py-2 text-gray-100 transition-colors duration-500 hover:bg-blue-700 ${remaining <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={isRunning.value || remaining <= 0}
        >
          {isRunning.value ? (
            <div class="flex w-5 justify-center transition duration-500">
              <LoadingSpinner />
            </div>
          ) : (
            <h1 class="flex justify-center px-2 text-center">Send</h1>
          )}
        </button>
      </Form>
      <div class="group relative ml-1 px-2">
        <button
          name="language"
          class="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-100 hover:border-blue-500 focus:outline-none"
        >
          <span class="text-lg">{selectedLanguage.value.flag}</span>
        </button>

        <div class="absolute bottom-full right-0 z-10 hidden min-w-[120px] rounded-lg border border-gray-700 bg-gray-800 py-2 shadow-lg group-hover:block">
          {languages.map((lang) => (
            <div
              key={lang.code}
              class="cursor-pointer px-4 py-1 text-sm text-gray-100 hover:bg-gray-700"
              onClick$={async () => {
                selectedLanguage.value = lang;
                props.language.value = lang;
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
  );
});
