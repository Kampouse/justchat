import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
import { useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { type DocumentHead } from "@builder.io/qwik-city";

import Panel from "~/components/panel";
import * as Chat from "~/components/chat-component";
import { WarningBanner } from "~/components/warning-banner";
import { languages } from "~/components/chat-component";
import {
  CreateMessages,
  getStreamableResponse,
  type Message,
} from "~/routes/api";
import type { Language } from "~/components/chat-component";
import {
  useMessages,
  useServerSessio,
  useConved,
  useRemainingQueires,
  useTitle,
} from "./layout";

/* ==========================================================================
         Helper Functions
   ========================================================================== */
export const scrollToBottom = () => {
  const chatContainer = document.getElementById("chat");
  if (chatContainer) {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
  }
};

/* ==========================================================================
         Main Chat Component
   ========================================================================== */
export default component$(() => {
  const loc = useLocation();
  const suspensed = useSignal(false);
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const isMenuOpen = useSignal(false);
  const len = useSignal(0);
  const convs = useConved();
  const serverMessages = useMessages();
  const messages = useStore<{ value: Message[] }>({
    value: [...serverMessages.value],
  });
  const lastMessage = useStore<{ value: Message[] }>({
    value: [],
  });
  const uuid = useSignal<string>(loc.params["id"]);
  const session = useServerSessio();
  const remaining = useRemainingQueires();

  // Update conversation when location changes.
  useTask$(({ track }) => {
    track(() => loc.params);
    uuid.value = loc.params["id"];
    if (!isRunning.value) {
      messages.value = [...serverMessages.value];
    }
  });

  // Scroll to bottom when component mounts
  const defaultLanguage = languages.find(
    (e) => e.code === (session.value.user?.[0]?.language ?? "fr"),
  );
  const language = useSignal<Language>(
    defaultLanguage || {
      code: "fr",
      name: "French",
      flag: "🇫🇷",
    },
  );
  const submit = $(async (e: Event) => {
    try {
      const form = e.target as HTMLFormElement;
      e.preventDefault();

      const formData = new FormData(form);
      const userMessage = formData.get("message") as string;

      // Validate not empty message
      if (!userMessage.trim()) {
        return;
      }

      // Clear input immediately
      const inputElement = form.querySelector(
        'input[name="message"]',
      ) as HTMLInputElement;
      inputElement.value = "";

      // Update UI state
      isErroring.value = false;
      isRunning.value = true;

      // Add message placeholder
      messages.value.push({ type: "human", content: userMessage });
      messages.value.push({ type: "ai", content: "" });

      // Initial scroll after messages are added
      setTimeout(scrollToBottom, 50);

      const streamData = await getStreamableResponse({
        input: userMessage,
        history: messages.value.slice(0, -1),
        systemPrompt: `You are a ${language.value.name} ${language.value.flag} teacher who is dedicated but strict. In each response: an intropected   answer in there base language while explaining why one would answer in the  <sentence> your nice and give a good vibe

`,
      });
      // More frequent scroll updates during streaming
      const intervalId = setInterval(scrollToBottom, 100);

      let fullResponse = "";
      for await (const item of streamData) {
        fullResponse += item + " ";
        messages.value[messages.value.length - 1].content = fullResponse.trim();
      }

      clearInterval(intervalId);

      // Final scroll after completion with a small delay
      setTimeout(scrollToBottom, 100);

      const msgs = await CreateMessages({
        ctx: session.value.session,
        uuid: uuid.value,
        convo: messages.value.slice(-2),
      });

      len.value = messages.value.length;

      if (!msgs) {
        isErroring.value = true;
      }
      lastMessage.value = msgs as Message[];
      isRunning.value = false;
    } catch (error) {
      console.error("Error in chat submission:", error);
      isErroring.value = true;
      isRunning.value = false;
    }
  });
  return (
    <div class="flex h-[100dvh] min-h-screen flex-col md:flex-row">
      <Panel
        isMenuOpen={isMenuOpen}
        suspensed={suspensed}
        session={session.value.session}
        convos={convs.value}
      />
      <div class="flex h-full max-h-[100dvh] flex-1 flex-col">
        <div id="chat" class="flex-1 overflow-y-auto bg-gray-700 p-2 md:p-4">
          {remaining.value <= 0 && (
            <WarningBanner
              title="Query Limit Reached"
              message="You've reached your daily query limit. Please upgrade your plan or wait until tomorrow."
              type="warning"
            />
          )}
          <div
            class={`flex flex-col space-y-3 transition-opacity duration-300 md:space-y-4 ${
              suspensed.value ? "opacity-0" : "opacity-100"
            }`}
          >
            {messages.value.map((message, index) => (
              <div
                key={index}
                class={`flex items-start ${
                  message.type === "human" ? "justify-end" : ""
                }`}
              >
                {message.type === "ai" && <Chat.AiAvatar />}

                <Chat.Message
                  message={{ ...message }}
                  last={index === messages.value.length - 1}
                />
              </div>
            ))}
          </div>
          <div
            class={`flex h-full items-center justify-center transition-opacity duration-300 ${
              suspensed.value ? "opacity-100" : "opacity-0"
            } ${!suspensed.value ? "hidden" : ""}`}
          >
            {suspensed.value && (
              <div class="fixed inset-0 flex items-center justify-center transition-opacity duration-700">
                <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-gray-300"></div>
              </div>
            )}
          </div>
        </div>

        {isErroring.value && (
          <div class="fixed bottom-20 left-0 right-0 mx-auto max-w-md p-2 md:p-4">
            <div class="animate-fade-in rounded-lg border border-red-200 bg-red-100 p-3 text-sm text-red-700 shadow-lg md:p-4 md:text-base">
              <div class="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 cursor-pointer md:h-5 md:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  onClick$={() => (isErroring.value = false)}
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
                <p class="font-medium">
                  An error occurred during chat. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        <div class="border-t border-gray-600 bg-gray-700 p-2 ">
          <Chat.ChatInput
            language={language}
            isMenuOpen={isMenuOpen}
            remaining={remaining.value ?? 0}
            messages={messages.value.length}
            onSubmit$={submit}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const title = resolveValue(useTitle);
  return {
    title: ("justChat | " + title?.name) as string,
    meta: [{ name: "description" }],
  };
};
