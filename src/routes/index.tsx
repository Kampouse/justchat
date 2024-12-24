import { component$, useSignal, $, useContext } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import * as Chat from "~/components/chat-component";
import { ChatOpenAI } from "@langchain/openai";
import { useNavigate } from "@builder.io/qwik-city";
import { v4 as uuid } from "uuid";
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

export default component$(() => {
  const nav = useNavigate();
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const ctx = useContext(ctx_msg);
  const id = uuid();
  type Message = {
    type: "ai" | "human";
    content: string;
  };

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

      ctx.push(...messages.value);

      return nav("/chat/" + id);
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
      <div class="rouded-lg fixed bottom-5 left-0 right-0 mx-auto max-w-4xl p-4">
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
