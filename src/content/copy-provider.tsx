"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  getCopy,
  LOCALE_COOKIE,
  type Copy,
  type Locale,
} from "@/content/i18n";

/**
 * F-10 · The dictionary, in React.
 *
 * The locale is decided once — on the server, from the cookie — and handed down
 * from the root layout, so the first paint is already in the right language and
 * nothing flickers on hydration.
 *
 * Switching writes the cookie — one store, read by both sides, so the server
 * and the client can never disagree about the language. A `localStorage`
 * mirror was tried and removed: it can only correct *after* hydration, which
 * is a second render and a visible flicker, and a browser that blocks cookies
 * gives the server nothing to read anyway.
 *
 * The switch also updates `<html lang>`. Screen readers change voice on that
 * attribute, and a Turkish sentence read in an English voice is worse than no
 * translation at all.
 *
 * And it calls `router.refresh()`. Every page here is a server component that
 * read the cookie at request time, so React state alone only re-translates the
 * client half — the headings, the sidebar and the section intros would keep the
 * old language until the next hard reload. The refresh re-renders the server
 * tree against the cookie we just wrote, and merges it back without losing any
 * client state, so a half-Turkish page cannot happen.
 */

interface LocaleValue {
  copy: Copy;
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

const YEAR = 60 * 60 * 24 * 365;

export function LocaleProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
    setLocaleState(next);
    router.refresh();
  };

  return (
    <LocaleContext.Provider
      value={{ copy: getCopy(locale), locale, setLocale }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Every user-facing string a component renders comes through here.
 *
 * Falls back to the default dictionary with no provider above it, so a
 * component can still be dropped into a story or a test on its own. In the app
 * the provider is at the root, so the fallback never runs.
 */
export function useCopy(): Copy {
  return useContext(LocaleContext)?.copy ?? getCopy(defaultLocale);
}

export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
} {
  const value = useContext(LocaleContext);
  return {
    locale: value?.locale ?? defaultLocale,
    setLocale: value?.setLocale ?? (() => {}),
  };
}
