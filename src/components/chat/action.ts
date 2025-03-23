import { server$ } from "@builder.io/qwik-city";
import { updateUserQueries } from "~/server/users";
import { updateUserLanguage } from "~/server/users";
import { generateLanguageLesson } from "~/server/ai";

export const UpdateUserLanguage = server$(async function (
  languageCode: string,
) {
  const session = this.sharedMap.get("session");
  return await updateUserLanguage(session, languageCode);
});

export const GenerateLesson = server$(async function (message: string) {
  const session = this.sharedMap.get("session");

  if (!session) {
    throw new Error("Session not found");
  }

  const output = await updateUserQueries(session);
  if (!output) {
    throw new Error("unable to generete lesson credit too low");
  }

  return await generateLanguageLesson(message);
});
