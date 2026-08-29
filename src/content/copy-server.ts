import { cookies } from "next/headers";
import {
  defaultLocale,
  getCopy,
  isLocale,
  LOCALE_COOKIE,
  type Copy,
  type Locale,
} from "@/content/i18n";

/**
 * F-10 · The dictionary, on the server.
 *
 * Server-only by construction: `next/headers` throws if a client component
 * imports it, so no extra guard package is needed.
 *
 * The cookie is the whole story: it holds a choice the person made, and with no
 * cookie the product opens in its default language.
 *
 * `Accept-Language` is deliberately not consulted. Guessing from the browser
 * means the first sentence a visitor reads depends on a setting they have
 * probably never seen, and two people sitting side by side get different
 * products. One default, one visible switch, one cookie.
 *
 * Reading either of these opts the route out of static prerendering. That is
 * the honest trade for a product whose first sentence has to be in the reader's
 * language; the workbench is an interactive surface, not a cached page.
 */
export async function getRequestLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : defaultLocale;
}

export async function getServerCopy(): Promise<Copy> {
  return getCopy(await getRequestLocale());
}
