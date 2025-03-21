import { server$ } from "@builder.io/qwik-city";
import { updateUserLanguage } from "~/server";
import { generateLanguageLesson } from "~/server";

export const UpdateUserLanguage = server$(async function (
  languageCode: string,
) {
  const session = this.sharedMap.get("session");
  return await updateUserLanguage(session, languageCode);
});

export const GenerateLesson = server$(async function (message: string) {
  const session = this.sharedMap.get("session");
  return await generateLanguageLesson(session, message);
});
