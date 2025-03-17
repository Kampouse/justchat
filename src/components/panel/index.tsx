import { component$, useTask$ } from "@builder.io/qwik";
import { Credentials } from "../credentials";
import type { Signal } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import type { Session } from "~/server";
import { useSignal } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth";
import { useResource$ } from "@builder.io/qwik";
import { GetConvos } from "~/server";
import { Resource } from "@builder.io/qwik";
import { DeleteConvo } from "~/routes/api";

type ConvoData = {
  type: string | null;
  id: number;
  name: string | null;
  uuid: string;
  createdAt: Date;
  createdBy: number | null;
};

export default component$(
  (props: {
    session: Session | null;
    isMenuOpen: Signal<boolean>;
    suspensed: Signal<boolean>;
  }) => {
    const loc = useLocation();
    const end = useSignal(7);
    const nav = useNavigate();
    const start = useSignal(0);
    const uuid = useSignal<string>(loc.params["id"]);
    const showDeleteModal = useSignal(false);
    const deleteTarget = useSignal<string | null>(null);

    const baseConvos = useSignal<ConvoData[]>([]);
    const deleted = useSignal<string[]>([]);
    const convos = useResource$(async (track) => {
      if (!props.session) {
        return { data: [], total: 0 };
      }

      // track.track(() => deleted.value.length);
      track.track(() => start.value);
      console.log("refreshing?");
      return GetConvos(props.session, start, end);
    });

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
            class="h-6 w-6 text-white transition-transform duration-200 hover:text-blue-400"
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

        {/* Delete Modal */}
        {showDeleteModal.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="fixed inset-0 bg-black bg-opacity-50"></div>
            <div class="relative z-50 w-96 rounded-lg bg-gray-800 p-6 text-white shadow-xl">
              <h3 class="mb-4 text-lg font-bold">Delete Chat</h3>
              <p class="mb-6 text-gray-300">
                Are you sure you want to delete this chat?
              </p>
              <div class="flex justify-end gap-4">
                <button
                  onClick$={async () => {
                    showDeleteModal.value = false;
                    deleteTarget.value = null;
                  }}
                  class="rounded bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick$={async () => {
                    // Add delete logic here

                    if (!deleteTarget.value) return;
                    const status = await DeleteConvo({
                      uuid: deleteTarget.value,
                    });

                    deleted.value.push(deleteTarget.value);
                    if (status) {
                      if (uuid.value === deleteTarget.value) {
                        nav("/");
                      }
                    }

                    showDeleteModal.value = false;
                    deleteTarget.value = null;
                  }}
                  class="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  role="button"
                  aria-label="Delete chat permanently"
                  tabIndex={0}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

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
              class="scrollbar-hide flex flex-grow flex-col gap-2 overflow-y-scroll rounded-xl px-2 [&::-webkit-scrollbar]:bg-gray-900"
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
                  if (!resolvedConvos.data.length) {
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

                  const existingUUIDs = new Set(
                    baseConvos.value.map((c) => c.uuid),
                  );

                  const newConvos = resolvedConvos.data.filter(
                    (convo) => !existingUUIDs.has(convo.uuid),
                  );

                  if (newConvos.length > 0) {
                    baseConvos.value = [...baseConvos.value, ...newConvos];
                  }

                  return (
                    <>
                      {baseConvos.value
                        .filter((chat) => !deleted.value.includes(chat.uuid))
                        .map((chat, index) => {
                          return (
                            <div
                              key={index}
                              class={`group relative w-full cursor-pointer rounded bg-gray-800  px-1 transition-all duration-300 ease-in-out hover:bg-gray-700 ${chat.uuid === uuid.value ? "scale-[1.02] border-2 border-blue-500 bg-gray-700 shadow-lg" : "border-2 border-gray-800"}`}
                            >
                              <div class="flex items-center justify-stretch gap-3 p-1">
                                <Link
                                  prefetch={false}
                                  href={"/chat/" + chat.uuid}
                                  onClick$={() => {
                                    props.isMenuOpen.value = false;
                                    if (chat.uuid !== uuid.value) {
                                      props.suspensed.value = true;
                                    }
                                  }}
                                  class="mr-3 min-w-0 flex-1 space-y-2"
                                >
                                  <h3 class="w-full whitespace-pre-wrap break-words text-sm font-medium leading-snug text-white">
                                    {chat.name ?? "no name yet"}
                                  </h3>
                                </Link>
                                <button
                                  class="invisible flex-shrink-0 rounded-full p-2.5 text-gray-400 transition-colors hover:bg-gray-600 hover:text-white group-hover:visible"
                                  onClick$={(e) => {
                                    e.preventDefault();
                                    deleteTarget.value = chat.uuid;
                                    showDeleteModal.value = true;
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      {resolvedConvos.total > 7 && (
                        <button
                          onClick$={async () => {
                            console.log(
                              "Fetching conversations...",
                              props.isMenuOpen.value,
                            );
                            if (
                              props.isMenuOpen.value == true &&
                              session.value
                            ) {
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
                      )}
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
