import { useSignIn } from "~/routes/plugin@auth";
import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
export const ModalLogin = component$((props: { show: Signal<boolean> }) => {
  const login = useSignIn();
  return (
    <dialog
      id="login-modal"
      class="rounded-lg bg-gray-800 p-6 text-white shadow-lg"
      open={props.show.value}
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-between">
          <h2 class="text-xl font-bold">Sign in to continue</h2>
          <button
            onClick$={() => (props.show.value = false)}
            class="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <p class="text-gray-300">
          Please sign in with your GitHub account to use the chat.
        </p>
        <button
          onClick$={async () => {
            await login.submit({
              providerId: "github",
              redirectTo: "/api/user/login/",
            });
          }}
          class="flex items-center justify-center gap-2 rounded  bg-red-300 px-4 py-2 hover:bg-gray-600"
        >
          Sign in with GitHub
        </button>
      </div>
    </dialog>
  );
});
