import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import * as Chat from "~/components/chat-component";
import { ChatOpenAI } from "@langchain/openai";
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
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
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
      throw Error();
      for await (const item of data) {
        messages.value[messages.value.length - 1].content += item + " ";
      }
      isRunning.value = false;
    } catch (error) {
      console.error("Error in chat submission:", error);
      isErroring.value = true;
      isRunning.value = false;
    }
  });

  return (
    <div class="flex h-screen flex-col">
      <div class="flex-1 overflow-y-auto bg-gray-50 p-4">
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
      <Chat.ChatInput onSubmit$={submit} isRunning={isRunning} />
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
