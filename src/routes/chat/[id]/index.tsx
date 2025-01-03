import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
import { useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { type DocumentHead } from "@builder.io/qwik-city";
import Panel from "~/components/panel";
import * as Chat from "~/components/chat-component";
import { routeLoader$ } from "@builder.io/qwik-city";
import {
  CreateMessages,
  getStreamableResponse,
  type Message,
} from "~/routes/api";
import {
  getAllMessages,
  getConvoByUuid,
  getConvos,
  type Session,
} from "~/server";
export const useMessages = routeLoader$(async (e) => {
  const ctx = e.sharedMap.get("session") as Session | null;
  const uuid = e.params.id;

  const messages = await getAllMessages({
    ctx: ctx,
    uuid: uuid,
  });
  if (!messages) throw e.redirect(302, "/");
  const msgs = messages.map((el) => {
    return {
      type: el.type,
      content: el.content,
    };
  });

  return msgs as Message[];
});

export const useServerSessio = routeLoader$((e) => {
  return e.sharedMap.get("session") as Session | null;
});

export const useConved = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;
  return (await getConvos(session)) ?? [];
});

export default component$(() => {
  const loc = useLocation();
  const suspensed = useSignal(false);
  const convs = useConved();
  const serverMessages = useMessages();
  const session = useServerSessio();
  const lastMessage = useStore<{ value: Message[] }>({
    value: [],
  });
  const messages = useStore<{ value: Message[] }>({
    value: [...serverMessages.value],
  });

  const isRunning = useSignal(false);
  const len = useSignal(0);
  const isErroring = useSignal(false);
  const uuid = useSignal<string>(loc.params["id"]);
  useTask$(({ track }) => {
    track(() => loc.params);

    uuid.value = loc.params["id"];
    if (isRunning.value == false) {
      messages.value = [...serverMessages.value];
    }
  });

  const submit = $(async (e: Event) => {
    try {
      const form = e.target as HTMLFormElement;
      e.preventDefault();
      //scroll down when user send a messages
      const chatContainer = document.getElementById("chat");
      console.log(chatContainer);
      if (chatContainer) {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: "smooth",
        });
      }

      const formData = new FormData(form);
      const message = formData.get("message");
      isErroring.value = false;
      messages.value = [
        ...messages.value,
        { type: "human", content: message as string },
      ];
      const inputElement = form.querySelector(
        'input[name="message"]',
      ) as HTMLInputElement;
      inputElement.value = "";
      const data = await getStreamableResponse(
        message as string,
        messages.value,
      );
      const output = "";
      messages.value = [
        ...messages.value,
        {
          type: "ai",
          content: output,
        },
      ];
      isRunning.value = true;
      for await (const item of data) {
        messages.value[messages.value.length - 1].content += item + " ";
        const chatContainer = document.getElementById("chat");
        if (chatContainer) {
          const threshold = 500; // pixels from bottom
          const isNearBottom =
            chatContainer.scrollHeight -
              chatContainer.scrollTop -
              chatContainer.clientHeight <=
            threshold;

          if (isNearBottom) {
            chatContainer.scrollTo({
              top: chatContainer.scrollHeight + 100,
              behavior: "smooth",
            });
          }
        }
      }

      const msgs = await CreateMessages({
        ctx: session.value,
        uuid: uuid.value,
        convo: messages.value.slice(-2), // Only send last user message and AI response
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
        suspensed={suspensed}
        session={session.value}
        convos={convs.value}
      />
      <div class="flex h-full max-h-[100dvh] flex-1 flex-col">
        <div id="chat" class="flex-1 overflow-y-auto bg-gray-700 p-2 md:p-4">
          <div
            class={`flex flex-col space-y-3 transition-opacity duration-300 md:space-y-4 ${suspensed.value ? "opacity-0" : "opacity-100"}`}
          >
            {messages.value.map((message, index) => (
              <div
                key={index}
                class={`flex items-start ${message.type === "human" ? "justify-end" : ""}`}
              >
                {message.type === "ai" && <Chat.AiAvatar />}
                <Chat.Message message={message} />
              </div>
            ))}
          </div>
          <div
            class={`flex h-full items-center justify-center transition-opacity duration-300 ${suspensed.value ? "opacity-100" : "opacity-0"} ${!suspensed.value ? "hidden" : ""}`}
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

        <div class="border-t border-gray-600 bg-gray-700 p-2 md:p-4">
          <Chat.ChatInput
            messages={messages.value.length}
            onSubmit$={submit}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
});
export const useTitle = routeLoader$(async (e) => {
  const ctx = e.sharedMap.get("session") as Session;
  const uuid = e.params["id"];

  return await getConvoByUuid({
    ctx: ctx,
    uuid: uuid,
  });
});
export const head: DocumentHead = ({ resolveValue }) => {
  const title = resolveValue(useTitle);
  return {
    title: ("justChat | " + title?.name) as string,
    meta: [
      {
        name: "description",
      },
    ],
  };
};
