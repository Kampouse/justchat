import { type RequestHandler } from "@builder.io/qwik-city";
import { SyncCustomer } from "~/server";

export const onGet: RequestHandler = async (ctx) => {
  const sessionToken = ctx.url.searchParams.get("customer_session_token");
  if (!sessionToken) {
    throw ctx.redirect(302, "/");
  }

  try {
    const stuff = ctx.sharedMap.get("session");
    const external_id = stuff.user.email;

    const customer = await SyncCustomer(external_id);

    console.log("SUBSCRIPTION STATE:", customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw ctx.redirect(302, "/");
  }
};
