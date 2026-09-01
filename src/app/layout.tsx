import type { Metadata } from "next";
import { Barlow_Condensed, Geist, IBM_Plex_Mono } from "next/font/google";
import { brand } from "@/content/brand";
import { LocaleProvider } from "@/content/copy-provider";
import { getRequestLocale, getServerCopy } from "@/content/copy-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/* S-01 · The workshop voice.

   The entry screen is a technical workshop surface, and a workshop's lettering
   is narrow: stencilled on a case, printed on a rail, set in a parts catalogue.
   Geist is the product's reading face and stays that; this one carries the
   designation, the scene label and the physical control — the words that are
   *printed on the object* rather than written about it.

   `latin-ext` is not optional here. The designation is Turkish and the face
   has to have `İ`, `ğ` and `ş` or the headline falls back mid-word. */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/* Technical values (pins, voltages, distances, tool names) carry a distinct
   engineering voice — see F-03. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* The tab title and the description are sentences, so they follow the reader's
   language like everything else. */
export async function generateMetadata(): Promise<Metadata> {
  const copy = await getServerCopy();
  return {
    title: {
      default: `${brand.name} — ${copy.brand.tagline}`,
      template: `%s · ${brand.name}`,
    },
    description: copy.brand.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /* Decided once, here, so the first paint is already in the right language and
     nothing has to flicker into place after hydration. */
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${barlowCondensed.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="bg-app text-ink min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
