import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import type { Message } from "./api";
import { createContextId } from "@builder.io/qwik";
export const onGet: RequestHandler = async () => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
};

export const ctx_msg = createContextId<Message[]>("messages");
export default component$(() => {
  return <Slot />;
});
