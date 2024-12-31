import { useSignIn, useSignOut } from "~/routes/plugin@auth";
import { component$ } from "@builder.io/qwik";
import type { Session } from "~/server";
export const Credentials = component$<Session | null>((props) => {
  const login = useSignIn();
  const logout = useSignOut();
  return (
    <div
      id="login-modal"
      class="mx-auto mt-2 max-w-[90vw] rounded-lg bg-gray-800  p-3 text-white shadow-lg sm:p-6"
    >
      <div class="flex flex-col gap-3">
        {!props?.user ? (
          <>
            <div class="flex flex-row items-center sm:flex-col">
              <p class="text-xs text-gray-300 sm:text-base">
                Please sign in with your GitHub account to use the chat.
              </p>
            </div>
            <button
              onClick$={async () => {
                await login.submit({
                  providerId: "github",
                  redirectTo: "/api/user/login/",
                });
              }}
              class="flex items-center justify-center gap-2 rounded bg-blue-600 px-2 py-1.5 text-xs hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-base"
            >
              <svg
                class="h-3.5 w-3.5 sm:h-5 sm:w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </>
        ) : (
          <div class="flex flex-row items-center gap-2 rounded-lg sm:flex-row sm:gap-6">
            <img
              src={props.user.image}
              alt="Profile"
              width="40"
              height="40"
              class="h-8 w-8 rounded-full border-2 border-blue-500 shadow-lg sm:h-12 sm:w-12"
            />
            <div class="flex flex-row items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
              <p class="text-sm font-semibold text-blue-100 sm:text-left sm:text-lg">
                {props.user.name}
              </p>
              <div class="flex flex-row items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500"></div>
                <button
                  onClick$={async () => {
                    await logout.submit({});
                  }}
                  type="submit"
                  class="flex items-center gap-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white sm:text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 sm:h-4 sm:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
