import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useTranslation } from "react-i18next";

const languages = ["fr", "en"];

export function LanguageSelect() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";

  return (
    <Listbox value={current} onChange={(value) => i18n.changeLanguage(value)}>
      <div className="relative">
        <ListboxButton className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea">
          {t(`language.${current}`)}
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="z-40 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg [--anchor-gap:8px] focus:outline-none"
        >
          {languages.map((language) => (
            <ListboxOption
              key={language}
              value={language}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-cyan-50 data-[selected]:font-semibold"
            >
              {t(`language.${language}`)}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
