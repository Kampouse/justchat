import { component$, useTask$ } from "@builder.io/qwik";
import { Credentials } from "../credentials";
import type { Signal } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type Convos = Awaited<ReturnType<typeof GetConvos>>;
import { useLocation } from "@builder.io/qwik-city";
import type { Session } from "~/server";
import { useSignal } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth";
import { useResource$ } from "@builder.io/qwik";
import { GetConvos } from "~/server";
import { Resource } from "@builder.io/qwik";
export default component$(
  (props: {
    session: Session | null;
    convos: Convos;
    isMenuOpen: Signal<boolean>;
    suspensed: Signal<boolean>;
  }) => {
    const loc = useLocation();
    const end = useSignal(7);
    const nav = useNavigate();
    const start = useSignal(0);
    const uuid = useSignal<string>(loc.params["id"]);
    const convos = useResource$<Convos | []>(async (track) => {
      if (!props.session) {
        return [];
      }
      track.track(() => start.value);

      return (await GetConvos(props.session, start, end)) ?? [];
    });
    const baseConvos = useSignal<Convos>([]);

    useTask$(({ track }) => {
      track(() => loc.params);
      uuid.value = loc.params["id"];
      props.suspensed.value = false;
    });
    const isPanelHidden = useSignal(false);
    const session = useSession();

    return (
      <>
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick$={() => (props.isMenuOpen.value = !props.isMenuOpen.value)}
          class="fixed left-2 top-4 z-50 w-fit p-4 md:hidden"
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

        {/* Toggle panel button - only visible on desktop */}
        <button
          onClick$={() => (isPanelHidden.value = !isPanelHidden.value)}
          class="fixed left-2 top-4 z-50 hidden w-fit rounded-lg p-4 transition-colors duration-200 hover:bg-gray-800 md:block"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-white transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{
              transform: isPanelHidden.value
                ? "rotate(180deg)"
                : "rotate(0deg)",
            }}
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Sidebar panel */}
        <div
          class={`fixed inset-y-0 left-0 transform ${
            props.isMenuOpen.value ? "translate-x-0" : "-translate-x-full"
          } z-40 flex w-full flex-col justify-between overflow-y-auto border-gray-800 bg-gray-900 p-2 transition duration-200 ease-in-out md:relative md:w-72 ${
            isPanelHidden.value ? "md:-translate-x-full" : "md:translate-x-0"
          }`}
        >
          <div class="flex h-full flex-col">
            <div class="items-center justify-between pb-2 md:pl-2 ">
              {session.value && (
                <div class="flex flex-row items-center justify-between gap-4 rounded-lg bg-gray-800 p-4">
                  <h2 class="flex-1 text-center text-xl font-bold text-white">
                    Chat History
                  </h2>
                  <Link
                    prefetch={false}
                    href={"/"}
                    onClick$={() => {
                      if (loc.url.pathname === "/") {
                        props.isMenuOpen.value = false;
                        return;
                      }
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
              )}
            </div>
            <div
              class="scrollbar-hide flex flex-grow flex-col gap-2 overflow-y-scroll rounded-xl px-2"
              onScroll$={(event) => {
                const target = event.target as HTMLElement;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight;
                const clientHeight = target.clientHeight;

                if (scrollTop + clientHeight >= scrollHeight) {
                  start.value += 15;
                }
              }}
            >
              <Resource
                value={convos}
                onRejected={(error) => <div>Error: {error.message}</div>}
                onResolved={(resolvedConvos) => {
                  // Keep track of all unique conversations by uuid
                  // Convert map back to array and filter out any undefined
                  if (!resolvedConvos) {
                    resolvedConvos = [] as Convos;
                  }

                  // Only add conversations that don't already exist in baseConvos
                  // Filter out conversations that already exist in baseConvos
                  // Use a Set to efficiently track existing UUIDs
                  const existingUUIDs = new Set(
                    baseConvos.value.map((c) => c.uuid),
                  );

                  // Filter out conversations that already exist in baseConvos
                  const newConvos = resolvedConvos.filter(
                    (convo) => !existingUUIDs.has(convo.uuid),
                  );

                  // Add only unique conversations to baseConvos
                  if (newConvos.length > 0) {
                    baseConvos.value = [...baseConvos.value, ...newConvos];
                  }

                  if (!baseConvos.value.length) {
                    return session.value ? (
                      <Link
                        href="/"
                        onClick$={() => {
                          props.isMenuOpen.value = false;
                        }}
                        class="flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 text-white transition-colors duration-200 hover:bg-blue-700"
                      >
                        <span>Start Chatting</span>
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
                    ) : null;
                  }
                  return (
                    <>
                      {baseConvos.value.map((chat, index) => (
                        <div
                          key={index}
                          class={`relative cursor-pointer rounded bg-gray-800 p-3 px-4 transition-all duration-300 ease-in-out hover:bg-gray-700 ${chat.uuid === uuid.value ? "scale-[1.02] border-2 border-blue-500 bg-gray-700 shadow-lg" : "border-2 border-gray-800"}`}
                        >
                          <Link
                            prefetch={false}
                            href={"/chat/" + chat.uuid}
                            onClick$={() => {
                              props.isMenuOpen.value = false;
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
                      <button
                        onClick$={async () => {
                          console.log(
                            "Fetching conversations...",
                            props.isMenuOpen.value,
                          );
                          if (props.isMenuOpen.value == true && session.value) {
                            nav("/list");
                          }
                          if (
                            props.isMenuOpen.value == false &&
                            session.value
                          ) {
                            start.value += 3;
                          }
                        }}
                        class="mt-4 w-full rounded-lg bg-gray-800 py-2 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                      >
                        Load More
                      </button>
                    </>
                  );
                }}
              />
            </div>
            <Credentials user={props.session?.user as any} />
          </div>
        </div>

        {/* Overlay when menu is open on mobile */}
        {props.isMenuOpen.value && (
          <div
            class="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick$={() => (props.isMenuOpen.value = false)}
          />
        )}
      </>
    );
  },
);
