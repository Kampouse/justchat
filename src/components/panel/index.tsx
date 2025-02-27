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
import { useSession } from "~/routes/plugin@auth";
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
    const session = useSession();
    return (
      <>
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
          class="fixed left-2  top-0 z-50 w-fit   p-4  md:hidden"
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
            <div class="items-center justify-between pb-2 md:pl-2 ">
              {(session.value && (
                <div class="flex flex-row items-center justify-between rounded-lg bg-gray-800 p-4  pl-32 md:pl-4">
                  <h2 class="text-center text-xl font-bold text-white">
                    Chat History
                  </h2>
                  <Link
                    prefetch={false}
                    href={"/"}
                    onClick$={() => {
                      if (loc.url.pathname === "/") {
                        return;
                      }

                      //isMenuOpen.value = false;
                      props.suspensed.value = true;
                    }}
                    class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="h-5 w-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </Link>
                </div>
              )) || (
                <h2 class="text-lg font-semibold text-white">
                  You chat history is waiting
                </h2>
              )}
            </div>
            <div class="scrollbar-hide flex flex-grow flex-col gap-2 overflow-y-scroll rounded-xl px-2">
              {props.convos &&
                props.convos.map((chat, index) => (
                  <div
                    key={index}
                    class={`relative cursor-pointer rounded bg-gray-800 p-3 px-4 transition-all duration-300 ease-in-out hover:bg-gray-700 ${chat.uuid === uuid.value ? "scale-[1.02] border-2 border-blue-500 bg-gray-700 shadow-lg" : "border-2 border-gray-800"}`}
                  >
                    <Link
                      prefetch={false}
                      href={"/chat/" + chat.uuid}
                      onClick$={() => {
                        isMenuOpen.value = false;
                        if (chat.uuid !== uuid.value) {
                          props.suspensed.value = true;
                        }
                      }}
                      class="relative block"
                    >
                      <h3 class="truncate text-sm font-medium text-white">
                        {chat.name ?? "no name yet"}
                      </h3>
                      <p class="flex items-center gap-2 truncate text-xs text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(chat.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hourCycle: "h23",
                            localeMatcher: "best fit",
                          },
                        )}
                      </p>
                    </Link>
                  </div>
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
