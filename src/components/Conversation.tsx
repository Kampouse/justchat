import { WarningBanner } from "./warning-banner";
import { type Message } from "./chat/Message";
import { Message as MessageComponent } from "./chat/Message";
import { component$ } from "@builder.io/qwik";
import Avatar from "./chat/Avatar";
export const Conversation = component$<{
  messages: { value: Message[] };
  suspensed: { value: boolean };
  remaining: number;
  isErroring: { value: boolean };
}>(({ messages, suspensed, remaining, isErroring }) => {
  return (
    <div class="flex h-full max-h-[100dvh] flex-1 flex-col">
      <div
        id="chat"
        class="flex-1 overflow-y-auto bg-gray-700 p-2 md:p-4 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar]:bg-gray-700"
      >
        {remaining <= 0 && (
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
              {message.type === "ai" && <Avatar />}

              <MessageComponent
                message={{ ...message, remaining }}
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
    </div>
  );
});
