import { routeLoader$ } from "@builder.io/qwik-city";
import { type Session } from "~/server";
import {
  getAllMessages,
  getConvoByUuid,
  getConvos,
} from "~/server/conversations";
import { getUser, GetRemainingQueries } from "~/server/users";
import { type Message } from "~/components/chat/Message";
export const useMessages = routeLoader$(async (e) => {
  const ctx = e.sharedMap.get("session") as Session | null;
  const uuid = e.params.id;

  const messages = await getAllMessages({ ctx, uuid });
  if (!messages) throw e.redirect(302, "/");

  return messages.map((el) => ({
    type: el.type,
    content: el.content,
    primaryLanguage: el.primaryLanguage,
    secondaryLanguage: el.secondaryLanguage,
    id: el.id.toString(),
  })) as Message[];
});

export const useServerSessio = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;

  const user = await getUser(session);
  return { user, session };
});

export const useConved = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;
  return await getConvos(session);
});

export const useRemainingQueires = routeLoader$(async (e) => {
  const session = e.sharedMap.get("session") as Session | null;

  if (!session) return 0;
  const data = await GetRemainingQueries(session);
  if (data == null) {
    return 0;
  }
  return data;
});

export const useTitle = routeLoader$(async (e) => {
  const ctx = e.sharedMap.get("session") as Session;
  const uuid = e.params["id"];
  return await getConvoByUuid({ ctx, uuid });
});
