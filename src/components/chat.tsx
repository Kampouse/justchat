import {
  component$,
  useOnDocument,
  $,
  type QRL,
  type Signal,
  useSignal,
} from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
import { UpdateUserLanguage } from "./chat/action";
import { ScrollButton } from "./chat/ScrollButton";
import { SendButton } from "./chat/SendButton";
import { MessageInput } from "./chat/MessageInput";
import { LanguageSelector, languages, type Language } from "./chat/Languages";
export interface ChatInputProps {
  reset?: QRL<(e: Event) => void>;
  onSubmit$: QRL<(e: Event) => Promise<void>>;
  messages: number;
  remaining: number;
  isMenuOpen: Signal<boolean>;
  language: Signal<Language>;
  isRunning: Signal<boolean>;
}
export const scrollToBottom = () => {
  const chatContainer = document.getElementById("chat");
  if (chatContainer) {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
  }
};

export const ChatInput = component$<ChatInputProps>((props) => {
  const { onSubmit$, isRunning, remaining, language } = props;

  const selectedLanguage = useSignal<Language>(
    languages.find((lang) => lang.code === language.value.code) || languages[0],
  );
  const isAtBottom = useSignal(true);

  const handleScrollToBottom = $(() => {
    scrollToBottom();
  });

  const handleLanguageSelect = $(async (lang: Language) => {
    selectedLanguage.value = lang;
    props.language.value = lang;
    await UpdateUserLanguage(lang.code);
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
        <ScrollButton handleScrollToBottom={handleScrollToBottom} />
      )}

      <div class="fixed bottom-0 left-0 right-0 mx-2 rounded-full border border-transparent backdrop-blur-md sm:left-72 sm:mx-4 md:mx-8 lg:mx-32">
        <div class="mx-auto max-w-3xl px-4 py-2 pb-3">
          <Form
            preventdefault:submit
            onSubmit$={onSubmit$}
            class="mx-auto flex max-w-2xl items-center justify-center space-x-2"
          >
            <div class="flex w-full justify-center space-x-2">
              <MessageInput remaining={remaining} />
              <SendButton isRunning={isRunning} remaining={remaining} />
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                handleLanguageSelect={handleLanguageSelect}
              />
            </div>
          </Form>
        </div>
      </div>
    </>
  );
});
