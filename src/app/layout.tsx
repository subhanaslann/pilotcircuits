import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import { brand } from "@/content/brand";
import { LocaleProvider } from "@/content/copy-provider";
import { getRequestLocale, getServerCopy } from "@/content/copy-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/* Technical values (pins, voltages, distances, tool names) carry a distinct
   engineering voice — see F-03. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="bg-app text-ink min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
