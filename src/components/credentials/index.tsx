import { useSignIn, useSignOut } from "~/routes/plugin@auth";
import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { Session } from "~/server";
export const Credentials = component$<Session | null>((props) => {
  const login = useSignIn();
  const logout = useSignOut();
  return (
    <div
      id="login-modal"
      class=" mt-2 justify-center  rounded-lg bg-gray-800 p-3 pr-2
      text-white shadow-lg  md:max-w-[90vw]"
    >
      <div class="flex flex-col   justify-center gap-3  sm:justify-center">
        {!props?.user ? (
          <>
            <div class="flex flex-col items-center justify-center space-y-4">
              <p class="text-center text-sm text-gray-300 md:text-base">
                Welcome! Choose your preferred sign-in method to start chatting
              </p>
              <div class="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <button
                  onClick$={async () => {
                    await login.submit({
                      providerId: "github",
                      redirectTo: "/api/user/login/",
                    });
                  }}
                  class="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
                <button
                  onClick$={async () => {
                    await login.submit({
                      providerId: "google",
                      redirectTo: "/api/user/login/",
                    });
                  }}
                  class="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </div>
            </div>
          </>
        ) : (
          <div class="flex flex-row items-center justify-center gap-2 rounded-lg sm:flex-row sm:gap-6">
            <Link href="/profile" class="group relative">
              <img
                src={props.user.image}
                alt="Profile"
                width="40"
                height="40"
                class="h-8 w-8 rounded-full border-2 border-blue-500 shadow-lg transition-colors hover:border-blue-400 sm:h-12 sm:w-12"
              />
            </Link>
            <div class="flex flex-row items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
              <p class="text-sm font-semibold text-blue-100 sm:text-left sm:text-lg">
                {props.user.name}
              </p>
              <div class="flex flex-row items-center gap-2">
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
