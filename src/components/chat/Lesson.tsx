import { component$ } from "@builder.io/qwik";

import type { TranslationObjectSchema } from "~/server/ai";
export default component$<{
  lessonData: typeof TranslationObjectSchema._type;
}>(({ lessonData }) => {
  return (
    <div class="mt-4 border-t border-gray-800/50 pt-4">
      <div class="space-y-6 text-base">
        {lessonData.translation && (
          <div class="rounded-lg bg-blue-900/20 p-4 backdrop-blur-sm">
            <span class="mb-2 block text-lg font-bold text-blue-400">
              Translation
            </span>
            <span class="text-lg text-gray-100">{lessonData.translation}</span>
          </div>
        )}

        {lessonData.explanation && (
          <div class="rounded-lg bg-purple-900/20 p-4 backdrop-blur-sm">
            <span class="mb-2 block text-lg font-bold text-purple-400">
              Explanation
            </span>
            <span class="text-lg leading-relaxed text-gray-100">
              {lessonData.explanation}
            </span>
          </div>
        )}

        {lessonData.pitfall && (
          <div class="rounded-lg bg-rose-900/20 p-4 backdrop-blur-sm">
            <span class="mb-2 block text-lg font-bold text-rose-400">
              Watch Out!
            </span>
            <span class="text-lg leading-relaxed text-gray-100">
              {lessonData.pitfall}
            </span>
          </div>
        )}

        {lessonData.grammars && lessonData.grammars.length > 0 && (
          <div class="rounded-lg bg-emerald-900/20 p-4 backdrop-blur-sm">
            <span class="mb-3 block text-lg font-bold text-emerald-400">
              Grammar Rules
            </span>
            <div class="space-y-3">
              {lessonData.grammars.map((rule, index) => (
                <div key={index} class="flex gap-3 text-gray-100">
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {index + 1}
                  </span>
                  <span class="text-lg leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lessonData.pronunciation && (
          <div class="rounded-lg bg-amber-900/20 p-4 backdrop-blur-sm">
            <span class="mb-2 block text-lg font-bold text-amber-400">
              Pronunciation Guide
            </span>
            <span class="text-lg leading-relaxed text-gray-100">
              {lessonData.pronunciation}
            </span>
          </div>
        )}

        {lessonData.practical.conversation.length > 0 && (
          <div class="rounded-lg bg-indigo-900/20 p-4 backdrop-blur-sm">
            <span class="mb-3 block text-lg font-bold text-indigo-400">
              Practice Conversation
            </span>
            <div class="divide-y divide-indigo-900/30">
              {lessonData.practical.conversation.map((conv, index) => (
                <div key={index} class="space-y-4 py-4 first:pt-0 last:pb-0">
                  {conv.context && (
                    <div class="mb-3 text-base italic text-indigo-300">
                      {conv.context}
                    </div>
                  )}
                  <div class="space-y-4">
                    <div class="rounded-lg bg-indigo-950/30 p-3">
                      <div class="text-lg font-medium text-gray-100">
                        A: {conv.person1}
                      </div>
                      <div class="mt-1 text-base text-indigo-300">
                        {conv.person1_base}
                      </div>
                    </div>
                    <div class="rounded-lg bg-indigo-950/30 p-3">
                      <div class="text-lg font-medium text-gray-100">
                        B: {conv.person2}
                      </div>
                      <div class="mt-1 text-base text-indigo-300">
                        {conv.person2_base}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
