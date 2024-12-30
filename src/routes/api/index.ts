import { server$ } from "@builder.io/qwik-city";
import {
  streamableResponse,
  createConvo,
  createMessages,
  createChatTitle,
} from "~/server";
import type { Session } from "~/server";
import Drizzler from "../../../drizzle";
import { conversations } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

export type Message = {
  type: "ai" | "human";
  content: string;
};

export const getStreamableResponse = server$(streamableResponse);
export const CreateConvo = server$(
  async (ctx: Session | null, uuid: string, messages: Message[]) => {
    if (!ctx) return;
    const conv = createConvo(ctx, uuid);
    const drizzle = Drizzler();

    const title = await createChatTitle(messages);
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
        } satisfies Message;
      });
    } catch (error) {
      console.error("Error creating messages:", error);
      return null;
    }
  },
);
