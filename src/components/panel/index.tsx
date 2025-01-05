import { component$, useTask$ } from "@builder.io/qwik";
import { Credentials } from "../credentials";
import type { getConvos } from "~/server";
import type { Signal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type Convos = Awaited<ReturnType<typeof getConvos>>;
import { useLocation } from "@builder.io/qwik-city";
import type { Session } from "~/server";
import { useSignal } from "@builder.io/qwik";
export default component$(
  (props: {
    session: Session | null;
    convos: Convos;
    suspensed: Signal<boolean>;
  }) => {
    const loc = useLocation();
    const uuid = useSignal<string>(loc.params["id"]);

    useTask$(({ track }) => {
      track(() => loc.params);
      uuid.value = loc.params["id"];
      props.suspensed.value = false;
    });
    const isMenuOpen = useSignal(false);

    return (
      <>
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
          class="fixed left-0 top-0 z-50 w-full  p-4  md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Sidebar panel */}
        <div
          class={`fixed inset-y-0 left-0 transform ${isMenuOpen.value ? "translate-x-0" : "-translate-x-full"} z-40 flex w-full flex-col justify-between overflow-y-auto border-gray-800 bg-gray-900 p-2 transition duration-200 ease-in-out md:relative md:w-72 md:translate-x-0`}
        >
          <div class="flex h-full flex-col">
            <h2 class="mb-2 pb-2 text-center text-lg font-semibold text-white">
              Previous convos
            </h2>
            <div class="scrollbar-hide flex flex-grow flex-col gap-2 overflow-y-scroll rounded-xl pr-2">
              {props.convos &&
                props.convos.map((chat, index) => (
                  <Link
                    prefetch={false}
                    href={"/chat/" + chat.uuid}
                    key={index}
                    onClick$={() => {
                      isMenuOpen.value = false;
                      if (chat.uuid !== uuid.value) {
                        props.suspensed.value = true;
                      }
                    }}
                    class={`cursor-pointer rounded bg-gray-800 p-3 px-4 transition-all duration-300 ease-in-out hover:bg-gray-700 ${chat.uuid === uuid.value ? "scale-[1.02] border-2 border-blue-500 bg-gray-700 shadow-lg" : "border-2 border-gray-800"}`}
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

            <Credentials user={props.session?.user as any} />
          </div>
        </div>

        {/* Overlay when menu is open on mobile */}
        {isMenuOpen.value && (
          <div
            class="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick$={() => (isMenuOpen.value = false)}
          />
        )}
      </>
    );
  },
);
