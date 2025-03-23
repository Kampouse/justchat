import type { RequestHandler } from "@builder.io/qwik-city";
import { v4 } from "uuid";
import { createConvo } from "~/server/conversations";
import { createUser } from "~/server/users";
export const onRequest: RequestHandler = async (event) => {
  const session = event.sharedMap.get("session");
  if (session) {
    const id = v4();
    try {
      if (
        session.user.email.includes("@tractr") ||
        session.user.email.includes("@jemartel")
      ) {
        await createUser(session);
      } else {
        throw event.redirect(302, "/");
      }

      await createUser(session);
      await createConvo(session, id);
    } catch (e) {
      console.error(e);
    }
    throw event.redirect(302, "/chat/" + id);
  }
};
