import { type RequestHandler } from "@builder.io/qwik-city";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { customersGetExternal } from "@polar-sh/sdk/funcs/customersGetExternal.js";

export const onGet: RequestHandler = async (ctx) => {
  const sessionToken = ctx.url.searchParams.get("customer_session_token");
  console.log("frejkgnrkjngjkernkger->>>>>>>>>>>>>.", sessionToken);
  if (!sessionToken) {
    throw ctx.redirect(302, "/");
  }

  const polar = new PolarCore({
    accessToken: ctx.env.get("POLAR_ID_TEST"),
    server: "sandbox",
  });

  try {
    const stuff = ctx.sharedMap.get("session");
    const external_id = stuff.user.email;
    const data = await customersGetExternal(polar, {
      externalId: external_id,
    });
    console.log("SUBSCRIPTION STATE:", data);
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw ctx.redirect(302, "/");
  }
};
