import cs from "./cs.json";
import en from "./en.json";

export type Dictionary = typeof cs;

export const locales = ["cs", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "cs";

const dictionaries: Record<Locale, Dictionary> = { cs, en };

/**
 * MVP has no locale routing — every page reads the default (Czech) dictionary.
 * sk/de/pl are planned; add a JSON file + entry here when they're translated.
 */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}
