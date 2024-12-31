import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async () => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
};

export default component$(() => {
  return (
    <div class="bg-gray-700">
      <Slot />
    </div>
  );
});
