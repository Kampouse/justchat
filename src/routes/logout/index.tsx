import { component$, isServer, useOnDocument } from "@builder.io/qwik";
import { useSignOut } from "../plugin@auth";
import { useNavigate } from "@builder.io/qwik-city";
import { $ } from "@builder.io/qwik";
export default component$(() => {
  const signout = useSignOut();
  const nav = useNavigate();
  useOnDocument(
    "DOMContentLoaded",
    $(() => {
      if (!isServer) {
        console.log("Fff");
        signout.submit({ redirectTo: "/" });
        nav("/");
      }
    }),
  );

  return (
    <div class="container mx-auto px-4 py-8 text-center">
      <h1 class="mb-4 text-3xl font-bold">Goodbye!</h1>
      <p class="text-gray-600">
        Thank you for using our service. You have been successfully signed out.
      </p>
    </div>
  );
});
