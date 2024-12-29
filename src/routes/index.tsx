import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
import type { Message } from "./api";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import Panel from "~/components/panel";
import * as Chat from "~/components/chat-component";
import { useNavigate } from "@builder.io/qwik-city";
import { type Session } from "~/server";
import { v4 as uuid } from "uuid";
import { CreateConvo, CreateMessages, getStreamableResponse } from "./api";
import { getConvos } from "~/server";
export const useConvos = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;
  const convos = await getConvos(session);
  return convos ?? [];
});
export const useServerSession = routeLoader$((e) => {
  return e.sharedMap.get("session") as Session | null;
});

export default component$(() => {
  const nav = useNavigate();

  const user = useServerSession();
  const convos = useConvos();
  const session = useServerSession();

  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const showBanner = useSignal(true);
  const locator = useLocation();
  const isVsible = useSignal(user.value ? false : true);

  useTask$(({ track }) => {
    track(() => locator.url.pathname);
    console.log(locator.url.pathname);
    showBanner.value = true;
  });
  const messages = useStore<{ value: Message[] }>({
    value: [],
  });

  const submit = $(async (e: Event) => {
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const message = formData.get("message");

      isErroring.value = false;

      const inputElement = form.querySelector(
        'input[name="message"]',
      ) as HTMLInputElement;
      inputElement.value = "";

      messages.value = [
        ...messages.value,
        { type: "human", content: message as string },
      ];
      const conv_uuid = uuid();
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
      showBanner.value = false;
      for await (const item of data) {
        messages.value[messages.value.length - 1].content += item + " ";
      }

      const convo = await CreateConvo(user.value, conv_uuid, messages.value);

      await CreateMessages({
        ctx: user.value,
        uuid: conv_uuid,
        convo: messages.value,
      });

      return nav("/chat/" + conv_uuid);
      isRunning.value = false;
      if (!convo) return;
    } catch (error) {
      console.error("Error in chat submission:", error);
      isErroring.value = true;
      isRunning.value = false;
    }
  });

  return (
    <div class="flex h-screen">
      <Panel session={session.value} convos={convos.value} />

      <div class="flex flex-1 flex-col">
        <div class="flex-1 overflow-y-auto bg-gray-700 p-4">
          <div
            class={`flex flex-col space-y-4 ${!showBanner.value ? "hidden" : ""}`}
          >
            <div class="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mx-auto mb-4 text-gray-300"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 7v2M12 15v2M7 12h2M15 12h2" />
              </svg>
              <h2 class="mb-2 text-xl font-semibold text-white">
                Getting Started
              </h2>
              <div class="mx-auto max-w-md space-y-4 text-gray-300">
                <p>Welcome to the AI Chat! Here's how to use it:</p>
                <ol class="list-decimal pl-5 text-left">
                  <li>Type your message in the input box below</li>
                  <li>Press Enter or click Send to start the conversation</li>
                  <li>Previous conversations will appear above</li>
                  <li>Click the 'Reset' to start a new chat</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {isErroring.value && (
          <div class="fixed bottom-20 left-0 right-0 mx-auto max-w-md p-4">
            <div class="animate-fade-in rounded-lg border border-red-200 bg-red-100 p-4 text-red-700 shadow-lg">
              <div class="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 cursor-pointer"
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

        <div
          class={`border-t border-gray-600 bg-gray-700 p-4 ${isVsible.value ? "hidden" : ""}`}
        >
          {isRunning.value && (
            <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div class="rounded-lg bg-gray-800 p-6 text-white shadow-lg">
                <div class="flex flex-col items-center gap-4">
                  <div class="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  <p class="text-lg">Processing your conversation...</p>
                  <p class="text-sm text-gray-300">
                    You'll be redirected momentarily
                  </p>
                </div>
              </div>
            </div>
          )}

          <Chat.ChatInput
            messages={0}
            onSubmit$={submit}
            isRunning={isErroring}
          />
        </div>
      </div>
    </div>
  );
});
export const head: DocumentHead = {
  title: "Just Chat",
  meta: [
    {
      name: "description",
      content: "Just chatting",
    },
  ],
};
