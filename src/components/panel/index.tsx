import { component$, useTask$ } from "@builder.io/qwik";
import { Credentials } from "../credentials";
import type { getConvos } from "~/server";
import { Link } from "@builder.io/qwik-city";
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type Convos = Awaited<ReturnType<typeof getConvos>>;
import { useLocation } from "@builder.io/qwik-city";
import type { Session } from "~/server";
import { useSignal } from "@builder.io/qwik";
export default component$(
  (props: { session: Session | null; convos: Convos }) => {
    const loc = useLocation();
    const uuid = useSignal<string>(loc.params["id"]);

    useTask$(({ track }) => {
      track(() => loc.params);
      uuid.value = loc.params["id"];
    });

    return (
      <div class="flex w-72 flex-col justify-between  border-gray-800   bg-gray-900 p-2">
        <div>
          <h2 class="mb-2  pb-2 text-center text-lg font-semibold text-white">
            Previous convos
          </h2>
          <div class="scrollbar-hide flex max-h-[35em] flex-col gap-2 overflow-y-scroll rounded-xl  px-5">
            {props.convos &&
              props.convos.map((chat, index) => (
                <Link
                  href={"/chat/" + chat.uuid}
                  key={index}
                  class={`cursor-pointer rounded p-3 px-4 hover:bg-gray-500 ${
                    chat.uuid === uuid.value
                      ? " border border-blue-500 bg-gray-800"
                      : "bg-gray-600"
                  }`}
                >
                  <h3 class="truncate text-sm font-medium text-white">
                    {chat.name ?? "no name yet"}
                  </h3>
                  <p class="truncate text-xs text-gray-300">
                    {chat.createdAt.toLocaleString()}
                  </p>
                </Link>
              ))}
          </div>
        </div>

        <Credentials user={props.session?.user as any} />
      </div>
    );
  },
);
