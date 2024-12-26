import {
  component$,
  useSignal,
  $,
  useContext,
  useTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { routeLoader$, server$, useLocation } from "@builder.io/qwik-city";
import * as Chat from "~/components/chat-component";
import { ChatOpenAI } from "@langchain/openai";
import { useNavigate } from "@builder.io/qwik-city";
import type { Signal } from "@builder.io/qwik";
import { createConvo, type Session } from "~/server";
import type { Message } from "./chat/[id]";
import { useSignIn } from "./plugin@auth";
import { createMessages } from "~/server";
import { ctx_msg } from "./layout";
export const getStreamableResponse = server$(async function* (
  input: string,
  history: any[] = [],
) {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
    streaming: true,
  });

  const messages = [...history, { role: "user", content: input }];
  const stream = await llm.stream(messages);

  try {
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  } catch (err) {
    console.error("Streaming error:", err);
    throw err;
  }

  // Store the response in history
  history.push({ role: "user", content: input });
  const finalResponse = await llm.invoke(messages);
  history.push({ role: "assistant", content: finalResponse.content });

  return history;
});
export const CreateConvo = server$(async (ctx: Session | null) => {
  return createConvo(ctx);
});

export const CreateMessages = server$(
  async ({
    ctx,
    uuid,
    convo,
  }: {
    ctx: Session | null;
    uuid: string;
    convo: Message[];
  }) => {
    createMessages({
      ctx: ctx,
      uuid: uuid,
      convo: convo,
    });
  },
);

const ModalLogin = component$((props: { show: Signal<boolean> }) => {
  const login = useSignIn();
  return (
    <dialog
      id="login-modal"
      class="rounded-lg bg-gray-800 p-6 text-white shadow-lg"
      open={props.show.value}
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-between">
          <h2 class="text-xl font-bold">Sign in to continue</h2>
          <button
            onClick$={() => (props.show.value = false)}
            class="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <p class="text-gray-300">
          Please sign in with your GitHub account to use the chat.
        </p>
        <button
          onClick$={async () => {
            await login.submit({
              providerId: "github",
              redirectTo: "/api/user/login/",
            });
          }}
          class="flex items-center justify-center gap-2 rounded  bg-red-300 px-4 py-2 hover:bg-gray-600"
        >
          Sign in with GitHub
        </button>
      </div>
    </dialog>
  );
});

export const useServerSession = routeLoader$((e) => {
  return e.sharedMap.get("session") as Session | null;
});

export default component$(() => {
  const nav = useNavigate();
  const user = useServerSession();

  console.log(user.value);
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const isVsible = useSignal(user.value ? false : true);
  const ctx = useContext(ctx_msg);
  type Message = {
    type: "ai" | "human";
    content: string;
  };

  const messages = useStore<{ value: Message[] }>({
    value: [],
  });
  const loc = useLocation();
  useTask$(({ track }) => {
    track(() => loc.url);
    messages.value = [];
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

      const convo = await CreateConvo(user.value);
      if (!convo) return;
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
      }
      isRunning.value = false;
      while (ctx.length > 0) {
        ctx.pop();
      }

      await CreateMessages({
        ctx: user.value,
        uuid: convo.uuid,
        convo: messages.value,
      });
      return nav("/chat/" + convo?.uuid, {
        forceReload: true,
        replaceState: true,
      });
    } catch (error) {
      console.error("Error in chat submission:", error);
      isErroring.value = true;
      isRunning.value = false;
    }
  });

  return (
    <div class="flex h-screen flex-col">
      <div class="flex-1 overflow-y-auto  border border-gray-600 bg-gray-700 p-4">
        <div class="mb-4">
          <h2 class="mb-2 text-lg font-semibold text-white">Previous convos</h2>
          <ModalLogin show={isVsible} />

          <div class="flex flex-col gap-2">
            {messages.value
              .reduce(
                (chats, message, index) => {
                  if (index % 2 === 0 && message.type === "human") {
                    chats.push({
                      question: message.content,
                      answer: messages.value[index + 1]?.content || "",
                    });
                  }
                  return chats;
                },
                [] as { question: string; answer: string }[],
              )
              .slice(-5)
              .map((chat, index) => (
                <div
                  key={index}
                  class=" w-72 cursor-pointer rounded bg-gray-600 p-3 hover:bg-gray-500"
                  onClick$={() => {
                    const input = document.querySelector(
                      'input[name="message"]',
                    ) as HTMLInputElement;
                    input.value = chat.question;
                    input.focus();
                  }}
                >
                  <h3 class="truncate text-sm font-medium text-white">
                    {chat.question}
                  </h3>
                  <p class="truncate text-xs text-gray-300">{chat.answer}</p>
                </div>
              ))}
          </div>
        </div>

        <div class="flex flex-col space-y-4">
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
                <li>Click on previous messages to quickly ask them again</li>
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
        class={`rouded-lg fixed bottom-3 left-0 right-0 mx-auto max-w-4xl p-4 ${isVsible.value ? "hidden" : ""}`}
      >
        <Chat.ChatInput messages={0} onSubmit$={submit} isRunning={isRunning} />
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
