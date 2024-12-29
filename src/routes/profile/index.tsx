import { component$, $ } from "@builder.io/qwik";
import { useSignOut } from "../plugin@auth";
export default component$(() => {
  const logout = useSignOut();

  const handleLogout = $(() => {
    // Clear any auth tokens/session
    logout.submit({});
    // Redirect to login
  });

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-100">
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 class="mb-6 text-2xl font-bold text-gray-800">Profile</h1>

        <div class="space-y-4">
          <div class="flex items-center">
            <label class="w-20 text-gray-600">Name:</label>
            <span class="text-gray-800">John Doe</span>
          </div>

          <div class="flex items-center">
            <label class="w-20 text-gray-600">Email:</label>
            <span class="text-gray-800">john@example.com</span>
          </div>
        </div>

        <button
          onClick$={handleLogout}
          class="mt-8 w-full rounded bg-red-500 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
});
