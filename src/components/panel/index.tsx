import { component$ } from "@builder.io/qwik";
import { Credentials } from "../credentials";
import type { getConvos } from "~/server";
import { Link } from "@builder.io/qwik-city";
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type Convos = Awaited<ReturnType<typeof getConvos>>;
import { Login } from "../credentials";
import type { Session } from "~/server";
export default component$(
  (props: { session: Session | null; convos: Convos }) => {
    return (
      <div class="flex w-72 flex-col justify-between border-r border-gray-600 bg-gray-700 p-4">
        <div>
          <h2 class="mb-2 text-lg font-semibold text-white">Previous convos</h2>

          <div class="flex flex-col gap-2">
            {props.convos &&
              props.convos.slice(-5).map((chat, index) => (
                <Link
                  href={"/chat/" + chat.uuid}
                  key={index}
                  class="cursor-pointer rounded bg-gray-600 p-3 hover:bg-gray-500"
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
        {(!props.session && <Login />) || (
          <Credentials user={props.session?.user as any} />
        )}
      </div>
    );
  },
);
