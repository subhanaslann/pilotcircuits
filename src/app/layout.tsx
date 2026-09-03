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
    /* The site's own address, so the URL-based metadata fields below can be
       written relative and still resolve absolute. A crawler rendering a share
       card never saw the page the link came from, so `/og.png` means nothing to
       it; without a base, Next fails the build for exactly that reason. A `URL`
       rather than a string because this function does not opt into `use cache`
       — the serialisable form is only required there. */
    metadataBase: new URL(brand.origin),
    title: {
      default: `${brand.name} — ${copy.brand.tagline}`,
      template: `%s · ${brand.name}`,
    },
    description: copy.brand.description,
    /* The card a link becomes somewhere else.
     *
     * `public/og.png` is drawn by `ui/og-card.ts` and rasterised by
     * `scripts/make-icons.mjs`, so the share card is built from the same lamp
     * the tab icon is. Relative here and absolute in the output, because
     * `metadataBase` above is what a crawler needs and never had.
     *
     * No `title` or `description` of their own: Next fills both from the two
     * fields above, which means a chapter page that sets its own title gets a
     * card headed with *that* title rather than the site's. Writing them out
     * here would freeze every share on the home page's sentence.
     *
     * The image is one card in one language while the text beside it follows
     * the reader's — see the note in `ui/og-card.ts`.
     *
     * No `url` either, and for the same reason. A root layout's is inherited
     * by every route under it, so `url: "/"` published `og:url` as the home
     * page on all twenty — which is not a missing field, it is a wrong one:
     * it tells a crawler the chapter it is reading canonicalises to the entry
     * screen. Omitted, the crawler uses the address it asked for, which is the
     * true one. */
    openGraph: {
      type: "website",
      siteName: brand.name,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${brand.name} — ${copy.brand.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og.png"],
    },
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
