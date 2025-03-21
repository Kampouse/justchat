import { server$ } from "@builder.io/qwik-city";
import { type Message } from "~/components/chat/Message";
import {
  streamableResponse,
  createConvo,
  createMessages,
  createChatTitle,
  updateUserQueries,
  getRemainingQueries,
} from "~/server";
import type { Session } from "~/server";
import Drizzler from "../../../drizzle";
import { conversations } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

import { deleteConvoById } from "~/server";

export const getStreamableResponse = server$(async function ({
  input,
  history,
  systemPrompt,
}: {
  input: string;
  history: Message[];
  systemPrompt: string;
}) {
  const data = this.sharedMap.get("session");

  const result = await updateUserQueries(data);
  if (result == false) {
    throw new Error("User quotas exceeded or failed");
  }

  return streamableResponse({
    input: input,
    history: history,
    systemPrompt: systemPrompt,
  });
});

export const CreateConvo = server$(
  async (ctx: Session | null, uuid: string, messages: Message[]) => {
    if (!ctx) return;
    const result = await getRemainingQueries(ctx);
    if (result && result <= 0) {
      throw new Error("User quotas exceeded or failed");
    }
    const conv = createConvo(ctx, uuid);
    const drizzle = Drizzler();

    const title = await createChatTitle({
      messages,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    });
    await drizzle
      .update(conversations)
      .set({
        name: (title as string | null) ?? messages[0].content,
      })
      .where(eq(conversations.uuid, uuid));
    return conv;
  },
);
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
    try {
      if (!ctx) return;
      const msgs = await createMessages({
        ctx: ctx,
        uuid: uuid,
        convo: convo,
      });

      return msgs?.map((e) => {
        return {
          content: e.content,
          type: e.type as "ai" | "human",
          id: e.id.toString(),
        } satisfies Message;
      });
    } catch (error) {
      console.error("Error creating messages:", error);
      return null;
    }
  },
);
export const DeleteConvo = server$(async function ({ uuid }: { uuid: string }) {
  const data = this.sharedMap.get("session");
  if (!data) return;

  try {
    const result = await deleteConvoById(data, uuid);
    return result;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
});
