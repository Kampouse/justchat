import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form } from "@builder.io/qwik-city";
import { OpenAI } from "langchain";
import { OpenAIAgent } from "langchain/agents";
import { routeAction$ } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

import { ChatOpenAI } from "@langchain/openai";

export const getStreamableResponse = server$(async function* (input: string) {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
  });
  const data = await llm.invoke([{ role: "user", content: "Hi im bob" }]);
  console.log(data);
  const words = input.split(" ");

  for (const word of words) {
    yield word;
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
});

export const useSendChat = routeAction$(async () => {});
export default component$(() => {
  const isRunning = useSignal(false);
  type Message = {
    type: "bot" | "user";
    content: string;
  };

  const messages = useStore<{ value: Message[] }>({
    value: [],
  });

  return (
    <div class="flex h-screen flex-col">
      <div class="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div class="flex flex-col space-y-4">
          {messages.value.map((message, index) => (
            <div
              key={index}
              class={`flex items-start ${message.type === "user" ? "justify-end" : ""}`}
            >
              {message.type === "bot" && (
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 rounded-full bg-gray-300"></div>
                </div>
              )}
              <div
                class={`${message.type === "bot" ? "ml-3" : ""} rounded-lg ${message.type === "user" ? "bg-blue-500" : "bg-white"} p-3 shadow-sm`}
              >
                <p
                  class={
                    message.type === "user" ? "text-white" : "text-gray-800"
                  }
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="border-t border-gray-200 bg-white p-4">
        <Form
          onSubmit$={async (e) => {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const mess = formData.get("message");

            messages.value = [
              ...messages.value,
              { type: "user", content: mess as string },
            ];

            console.log(mess);

            const inputElement = form.querySelector(
              'input[name="message"]',
            ) as HTMLInputElement;
            inputElement.value = "";

            const data = await getStreamableResponse(mess as string);
            const output = "";
            messages.value = [
              ...messages.value,
              {
                type: "bot",
                content: output,
              },
            ];
            isRunning.value = true;
            for await (const item of data) {
              messages.value[messages.value.length - 1].content += item + " ";
            }
            isRunning.value = false;
          }}
          class="flex space-x-2"
        >
          <input
            type="text"
            name="message"
            placeholder="Type a message..."
            required
            minLength={1}
            autoComplete="off"
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            class="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            disabled={isRunning.value}
          >
            {isRunning.value ? (
              <>
                <svg
                  class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                generating...
              </>
            ) : (
              "Send"
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});
export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
