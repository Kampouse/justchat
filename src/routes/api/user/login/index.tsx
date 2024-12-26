import type { RequestHandler } from "@builder.io/qwik-city";
import { createUser } from "~/server";
export const onRequest: RequestHandler = async (event) => {
  const session = event.sharedMap.get("session");
  console.log("session", session);
  if (session) {
    createUser(session);
    throw event.redirect(302, "/");
  }
};
