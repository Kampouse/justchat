import type { RequestHandler } from "@builder.io/qwik-city";
import { createUser } from "~/server";
export const onRequest: RequestHandler = async (event) => {
  const session = event.sharedMap.get("session");
  if (session) {
    try {
      const stuff = await createUser(session);
      console.log(stuff);
    } catch (e) {
      console.error(e);
    }
    throw event.redirect(302, "/");
  }
};
