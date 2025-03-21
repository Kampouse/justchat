import { component$ } from "@builder.io/qwik";
import type { Signal, QRL } from "@builder.io/qwik";

export interface Language {
  code: string;
  name: string;
  flag: string;
}
export const languages: Language[] = [
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

export const LanguageSelector = component$<{
  selectedLanguage: Signal<Language>;
  handleLanguageSelect: QRL<(lang: Language) => Promise<void>>;
}>(({ selectedLanguage, handleLanguageSelect }) => {
  return (
    <div class="group relative">
      <button
        name="language"
        class="flex items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/50 p-3 text-gray-100 backdrop-blur-sm transition-colors duration-200 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
      >
        <span class="text-lg leading-none">{selectedLanguage.value.flag}</span>
      </button>

      <div class="absolute bottom-full right-0 z-10 hidden min-w-[140px] rounded-xl border border-gray-700/50 bg-gray-800/90 py-2 shadow-lg backdrop-blur-sm group-hover:block">
        {languages.map((lang) => (
          <div
            key={lang.code}
            class="cursor-pointer px-4 py-1.5 text-sm text-gray-100 transition-colors duration-150 hover:bg-gray-700/50"
            onClick$={() => handleLanguageSelect(lang)}
          >
            <span>
              {lang.flag} {lang.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
