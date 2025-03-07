import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
import type { Message } from "./api";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useStore } from "@builder.io/qwik";
import { Credentials } from "~/components/credentials";
import { routeLoader$, useLocation, useNavigate } from "@builder.io/qwik-city";
import Panel from "~/components/panel/index";
import * as Chat from "~/components/chat-component";
import { createUser, getUser, getConvos, type Session } from "~/server";
import { v4 as uuid } from "uuid";
import { languages } from "~/components/chat-component";
import { CreateConvo, CreateMessages, getStreamableResponse } from "./api";
import { WarningBanner } from "~/components/warning-banner";
import type { Language } from "~/components/chat-component";
import { GetRemainingQueries } from "~/server";

export const useConvos = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;
  const convos = await getConvos(session);
  return convos ?? [];
});

export const useRemainingQueries = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;
  if (!session) return 0;

  const data = await GetRemainingQueries(session);
  if (data == null) {
    return 0;
  }

  return data;
});

export const useServerSession = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;

  let user = (await getUser(session)) || [];
  if (user.length === 0 && session) {
    await createUser(session);
    user = (await getUser(session)) || [];
  }

  return {
    user,
    session,
    remaining: user.length > 0 ? user[0]?.queriesRemaining || 0 : 0,
  };
});
export const BasePrompt = (language: Language) => {
  return `You are an soft friend ${language.name} ${language.flag}  helping beginners frieind (A1 level). you will givem them a thruthful reply converstation  in tha format:
   `;
};

export default component$(() => {
  // Navigation hook
  const nav = useNavigate();

  const isMenuOpen = useSignal(false);
  const suspensed = useSignal(false);
  const user = useServerSession();
  const convos = useConvos();

  const user_lang = user.value.user[0].language;
  console.log(user_lang);
  const langy = languages.find((lang) => lang.code === user_lang);
  const selectedLanguage = useSignal<Language>(
    langy || {
      code: "fr",
      name: "French",
      flag: "🇫🇷",
    },
  );
  const isRunning = useSignal(false);
  const isErroring = useSignal(false);
  const showBanner = useSignal(true);
  const locator = useLocation();
  const isVisible = useSignal(user.value.session ? false : true);
  const isBannerVisible = useSignal(
    user.value.user &&
      user.value.user.length > 0 &&
      user.value.user[0].queriesRemaining &&
      user.value.user[0].queriesRemaining <= 0,
  );
  // Monitor route changes to trigger banner visibility
  useTask$(({ track }) => {
    track(() => locator.url.pathname);
    showBanner.value = true;
  });
  const messages = useStore<{ value: Message[] }>({
    value: [],
  });

  // Handle form submission for chat messages
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

      const data = await getStreamableResponse({
        input: message as string,
        history: messages.value,
        systemPrompt: BasePrompt(selectedLanguage.value),
      });

      const output = "";
      messages.value = [...messages.value, { type: "ai", content: output }];
      isRunning.value = true;
      showBanner.value = false;

      try {
        for await (const item of data) {
          if (item && typeof item === "object" && "secondaryLanguage" in item) {
            messages.value[messages.value.length - 1].content =
              item.primaryLanguage + " (" + item.secondaryLanguage + ")";
          }
        }
      } catch (err) {
        console.error("Error processing stream:", err);
        throw err;
      }

      const convo = await CreateConvo(
        user.value.session,
        conv_uuid,
        messages.value,
      );

      await CreateMessages({
        ctx: user.value.session,
        uuid: conv_uuid,
        convo: messages.value,
      });

      if (!convo) return;
      return nav("/chat/" + conv_uuid);
    } catch (error) {
      console.error("Error in chat submission:", error);
      isErroring.value = true;
      isRunning.value = false;
    }
  });

  return (
    <div class="flex h-screen">
      <Panel
        isMenuOpen={isMenuOpen}
        suspensed={suspensed}
        session={user.value.session}
        convos={convos.value}
      />
      <div class="flex flex-1 flex-col">
        {!user.value.session && (
          <div class="fixed bottom-0 left-0 right-0 z-50 block w-full border-t border-gray-600 bg-gray-800 p-4 shadow-lg md:hidden">
            <div class="mx-auto max-w-md">
              <Credentials user={user.value.user as any} />
            </div>
          </div>
        )}
        <div class="flex-1 overflow-y-auto bg-gray-700 p-4">
          {isBannerVisible.value && (
            <WarningBanner
              title="Query Limit Reached"
              message="You've reached your daily query limit. Please upgrade your plan or wait until tomorrow."
              type="warning"
            />
          )}
          {suspensed.value ? (
            <div class="flex h-full items-center justify-center">
              <div class="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          ) : (
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
                  class="mx-auto mb-4 text-gray-300"
                >
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 7v2M12 15v2M7 12h2M15 12h2" />
                </svg>
                <h2 class="mb-2 text-xl font-semibold text-white">
                  Getting Started
                </h2>
                <div class="mx-auto flex max-w-md flex-col justify-center space-y-4 text-gray-300">
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
          )}
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
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
                <p class="font-medium">
                  An error occurred during chat. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          class={`border-t border-gray-600 bg-gray-700 p-2 ${isVisible.value ? "hidden" : ""}`}
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
            language={selectedLanguage}
            remaining={user.value.remaining}
            onSubmit$={submit}
            isMenuOpen={isMenuOpen}
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
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },

    {
      property: "og:image",
      content:
        "https://images.nightcafe.studio/jobs/2XaPSbxbxtqU07IqTCPZ/2XaPSbxbxtqU07IqTCPZ--1--nqe8a.jpg?tr=w-320,c-at_max",
    },
    {
      property: "og:title",
      content: "Just Chat - AI Powered Conversations",
    },
    {
      property: "og:description",
      content: "Experience intelligent conversations with AI",
    },
    {
      property: "og:type",
      content: "website",
    },
  ],
};
