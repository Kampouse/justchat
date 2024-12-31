import type { RequestHandler } from "@builder.io/qwik-city";
import { v4 } from "uuid";
import { createUser, createConvo } from "~/server";
export const onRequest: RequestHandler = async (event) => {
  const session = event.sharedMap.get("session");
  if (session) {
    const id = v4();
    try {
      const stuff = await createUser(session);
      await createConvo(session, id);
      console.log(stuff);
    } catch (e) {
      console.error(e);
    }
    throw event.redirect(302, "/chat" + id);
  }
};
