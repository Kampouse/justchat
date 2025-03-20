import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
import { scrollToBottom } from "~/components/chat";
import { useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { type DocumentHead } from "@builder.io/qwik-city";
import Panel from "~/components/panel";
import * as Chat from "~/components/chat";
import type { Message, Language } from "~/components/chat";
import { languages } from "~/components/chat";
import { BasePrompt } from "~/routes";
import { CreateMessages, getStreamableResponse } from "~/routes/api";
import { Conversation } from "~/components/Conversation";
import {
  useMessages,
  useServerSessio,
  useRemainingQueires,
  useTitle,
} from "./layout";

export default component$(() => {
  const loc = useLocation();
  const suspensed = useSignal(false);
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const isMenuOpen = useSignal(false);
  const len = useSignal(0);
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

  useTask$(({ track }) => {
    track(() => loc.params);
    uuid.value = loc.params["id"];
    if (!isRunning.value) {
      messages.value = [...serverMessages.value];
    }
  });

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

      if (!userMessage.trim()) {
        return;
      }

      const inputElement = form.querySelector(
        'input[name="message"]',
      ) as HTMLInputElement;
      inputElement.value = "";

      isErroring.value = false;
      isRunning.value = true;

      messages.value.push({ type: "human", content: userMessage, id: "0" });
      messages.value.push({ type: "ai", content: "", id: "1" });

      setTimeout(scrollToBottom, 50);
      const streamData = await getStreamableResponse({
        input: userMessage,
        history: messages.value.slice(0, -2),
        systemPrompt: BasePrompt(language.value),
      });

      const intervalId = setInterval(scrollToBottom, 100);

      try {
        for await (const item of streamData) {
          if (typeof item === "object" && "secondaryLanguage" in item) {
            messages.value[messages.value.length - 1].content =
              item.primaryLanguage +
              (item.secondaryLanguage ? ` (${item.secondaryLanguage})` : "");
          }
        }
      } catch (err) {
        console.error("Error processing stream:", err);
        throw err;
      }

      clearInterval(intervalId);
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
      />
      <Conversation
        messages={messages}
        suspensed={suspensed}
        remaining={remaining.value}
        isErroring={isErroring}
      />
      <div class="">
        <Chat.ChatInput
          language={language}
          isMenuOpen={isMenuOpen}
          remaining={remaining.value}
          messages={messages.value.length}
          onSubmit$={submit}
          isRunning={isRunning}
        />
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
