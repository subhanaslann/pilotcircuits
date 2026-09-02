import { en, type Copy } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";

/**
 * F-10 · Language.
 *
 * One dictionary per locale, all typed against the English one, so adding
 * `de.ts` is: write the file, add two lines here, done. A key that is missing
 * or misspelled fails the build rather than showing up as a gap on screen.
 *
 * Where the locale *comes from* is deliberately not decided here. Today it is a
 * cookie set by the switcher; when the product grows routes it becomes a URL
 * segment. Everything downstream asks `getCopy(locale)` and does not care.
 */

export const locales = ["tr", "en"] as const;

export type Locale = (typeof locales)[number];

/** What the language is called in its own language — never translated. */
export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};

/** Short label for the switcher. */
export const localeCodes: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
};

/**
 * English by default. The tool titles, descriptions and refusals a host shows
 * its model all come from this dictionary, so the default decides what an
 * agent reads on a first visit, and English is the safer assumption for a
 * visitor nobody has met. The product stays bilingual; the switch and the
 * cookie are unchanged.
 */
export const defaultLocale: Locale = "en";

/** The cookie the switcher writes and the server reads on the next request. */
export const LOCALE_COOKIE = "cp-locale";

const dictionaries: Record<Locale, Copy> = { tr, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function getCopy(locale: Locale): Copy {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Copy };
