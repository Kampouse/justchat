import { component$, useTask$ } from "@builder.io/qwik";
import type { ResourceReturn } from "@builder.io/qwik";
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

// Types
type ConvoData = {
  type: string | null;
  id: number;
  name: string | null;
  uuid: string;
  createdAt: Date;
  createdBy: number | null;
};

// Components
const HamburgerButton = component$<{ isMenuOpen: Signal<boolean> }>(
  ({ isMenuOpen }) => (
    <button
      onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
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
  ),
);

const TogglePanelButton = component$<{ isPanelHidden: Signal<boolean> }>(
  ({ isPanelHidden }) => (
    <button
      onClick$={() => (isPanelHidden.value = !isPanelHidden.value)}
      class="fixed left-2 top-4 z-50 hidden w-fit rounded-lg p-4 transition-colors duration-200 md:block"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-white transition-transform duration-200 hover:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={{
          transform: isPanelHidden.value ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  ),
);

const DeleteModal = component$<{
  showDeleteModal: Signal<boolean>;
  deleteTarget: Signal<string | null>;
  uuid: Signal<string>;
  deleted: Signal<string[]>;
}>(({ showDeleteModal, deleteTarget, uuid, deleted }) => {
  const nav = useNavigate();
  return (
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
              if (!deleteTarget.value) return;
              const status = await DeleteConvo({
                uuid: deleteTarget.value,
              });

              if (status) {
                deleted.value = [...deleted.value, deleteTarget.value];
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
  );
});

const ChatItem = component$<{
  chat: ConvoData;
  uuid: Signal<string>;
  isMenuOpen: Signal<boolean>;
  deleted: Signal<string[]>;
  suspensed: Signal<boolean>;
  deleteTarget: Signal<string | null>;
  showDeleteModal: Signal<boolean>;
}>(
  ({
    chat,
    uuid,
    isMenuOpen,
    suspensed,
    deleteTarget,
    showDeleteModal,
    deleted,
  }) => {
    const nav = useNavigate();

    if (deleted.value.includes(chat.uuid)) {
      return null;
    }

    return (
      <div
        class={`group relative w-full cursor-pointer rounded-lg bg-gray-800 px-1 transition-all duration-300 ease-in-out hover:bg-gray-700 ${
          chat.uuid === uuid.value
            ? "scale-[1.02] border-2 border-blue-500 bg-gray-700 shadow-lg"
            : "border-2 border-gray-800"
        }`}
        onClick$={(e) => {
          isMenuOpen.value = false;
          if (chat.uuid !== uuid.value) {
            suspensed.value = true;
          }
          e.preventDefault();
          nav("/chat/" + chat.uuid);
        }}
      >
        <div class="flex items-center justify-stretch gap-3 p-1">
          <div class="mr-3 min-w-0 flex-1 space-y-2">
            <h3 class="w-full whitespace-pre-wrap break-words pl-1 text-sm font-medium leading-snug text-white">
              {chat.name ?? "no name yet"}
            </h3>
          </div>
          <button
            class="invisible flex-shrink-0 rounded-full p-2.5 text-gray-400 transition-colors hover:bg-gray-600 hover:text-white group-hover:visible"
            onClick$={(e) => {
              e.stopPropagation();
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
  },
);

const ChatList = component$<{
  convos: ResourceReturn<{ data: ConvoData[]; total: number }>;
  session: Signal<Session | null | undefined>;
  isMenuOpen: Signal<boolean>;
  baseConvos: Signal<ConvoData[]>;
  deleted: Signal<string[]>;
  uuid: Signal<string>;
  deleteTarget: Signal<string | null>;
  showDeleteModal: Signal<boolean>;
  suspensed: Signal<boolean>;
  start: Signal<number>;
  counter: Signal<number>;
}>(
  ({
    convos,
    session,
    isMenuOpen,
    baseConvos,
    deleted,
    uuid,
    deleteTarget,
    showDeleteModal,
    suspensed,
    start,
    counter,
  }) => {
    const nav = useNavigate();
    return (
      <Resource
        value={convos}
        onRejected={(error) => <div>Error: {error.message}</div>}
        onResolved={(resolvedConvos: { data: ConvoData[]; total: number }) => {
          if (!resolvedConvos.data.length) {
            return session.value ? (
              <Link
                href="/"
                onClick$={() => {
                  isMenuOpen.value = false;
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

          const existingUUIDs = new Set(baseConvos.value.map((c) => c.uuid));
          counter.value = resolvedConvos.total;
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
                .map((chat, index) => (
                  <ChatItem
                    key={index}
                    chat={chat}
                    uuid={uuid}
                    deleted={deleted}
                    isMenuOpen={isMenuOpen}
                    suspensed={suspensed}
                    deleteTarget={deleteTarget}
                    showDeleteModal={showDeleteModal}
                  />
                ))}
              {resolvedConvos.total > 7 &&
                start.value + 3 !== counter.value && (
                  <button
                    disabled={start.value + 3 == counter.value}
                    onClick$={async () => {
                      if (
                        start.value == counter.value ||
                        start.value + 3 == counter.value
                      ) {
                        if (start.value - counter.value > 0) {
                          start.value = counter.value - start.value;
                        }
                        return;
                      } else {
                        if (counter.value - start.value < 3) {
                          start.value = counter.value - start.value;
                        } else {
                          start.value += 3;
                        }
                      }

                      if (isMenuOpen.value == true && session.value) {
                        nav("/list");
                      }
                      if (isMenuOpen.value == false && session.value) {
                        if (start.value == counter.value) {
                          return;
                        }
                      }
                    }}
                    class="w-full rounded-lg bg-gray-800 py-2 text-sm text-white transition-colors duration-200 hover:bg-gray-700"
                  >
                    Load More
                  </button>
                )}
            </>
          );
        }}
      />
    );
  },
);

export default component$(
  (props: {
    session: Session | null;
    isMenuOpen: Signal<boolean>;
    suspensed: Signal<boolean>;
  }) => {
    const loc = useLocation();
    const end = useSignal(9);
    const start = useSignal(0);
    const uuid = useSignal<string>(loc.params["id"]);
    const showDeleteModal = useSignal(false);
    const deleteTarget = useSignal<string | null>(null);
    const counter = useSignal(0);
    const baseConvos = useSignal<ConvoData[]>([]);
    const deleted = useSignal<string[]>([]);
    const session = useSession();

    const convos = useResource$(async (track) => {
      if (!props.session) {
        return { data: [], total: 0 };
      }

      track.track(() => start.value);
      if (start.value > counter.value) {
        start.value = counter.value;
      }

      const stuff = await GetConvos(props.session, start, end);
      stuff.total;
      counter.value = stuff.total;
      return stuff;
    });

    useTask$(({ track }) => {
      track(() => loc.params);

      uuid.value = loc.params["id"];
      props.suspensed.value = false;
    });
    const isPanelHidden = useSignal(false);

    return (
      <>
        <HamburgerButton isMenuOpen={props.isMenuOpen} />
        <TogglePanelButton isPanelHidden={isPanelHidden} />

        {showDeleteModal.value && (
          <DeleteModal
            showDeleteModal={showDeleteModal}
            deleteTarget={deleteTarget}
            uuid={uuid}
            deleted={deleted}
          />
        )}

        <div
          class={`fixed inset-y-0 left-0 transform ${
            props.isMenuOpen.value ? "translate-x-0" : "-translate-x-full"
          } z-40 flex w-full flex-col justify-between border-gray-800 bg-gray-900 p-2 transition duration-200 ease-in-out md:relative md:w-72 ${
            isPanelHidden.value ? "md:-translate-x-full" : "md:translate-x-0"
          }`}
        >
          <div class="flex h-full flex-col">
            <div class="items-center justify-between pb-2">
              {session.value && (
                <div class="flex items-center justify-between rounded-lg bg-gray-800 p-4 pr-2">
                  <Link
                    href="/"
                    class="mx-auto text-xl font-bold text-white transition-colors hover:text-blue-400"
                  >
                    {" "}
                    JustChat
                  </Link>
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
                    class="flex items-center rounded-md bg-gray-800 p-2 text-gray-300 transition-colors hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
            <div
              class="scrollbar-hide flex flex-grow flex-col gap-2 overflow-y-auto rounded-xl px-1 [&::-webkit-scrollbar]:bg-transparent"
              onScroll$={(event) => {
                const target = event.target as HTMLElement;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight;
                const clientHeight = target.clientHeight;

                if (scrollTop + clientHeight >= scrollHeight) {
                  if (
                    start.value == counter.value ||
                    start.value + 3 == counter.value
                  ) {
                    if (start.value - counter.value > 0) {
                      start.value = counter.value - start.value;
                    }
                    return;
                  } else {
                    if (counter.value - start.value < 3) {
                      start.value = counter.value - start.value;
                    } else {
                      start.value += 3;
                    }
                  }
                }
              }}
            >
              <ChatList
                convos={convos}
                session={session as Signal<Session | null>}
                isMenuOpen={props.isMenuOpen}
                baseConvos={baseConvos}
                deleted={deleted}
                uuid={uuid}
                deleteTarget={deleteTarget}
                showDeleteModal={showDeleteModal}
                suspensed={props.suspensed}
                start={start}
                counter={counter}
              />
            </div>
            <Credentials session={props.session} />
          </div>
        </div>

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
