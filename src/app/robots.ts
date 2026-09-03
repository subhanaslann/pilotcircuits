import type { MetadataRoute } from "next";
import { brand } from "@/content/brand";

/**
 * What a crawler is allowed to read, which here is everything.
 *
 * Nothing on this origin is private: there is no account, no session and no
 * data belonging to anybody, so there is no path to keep out. `/lab` in
 * particular stays open on purpose — the README sends judges to it as the
 * design system the product was built from, and a `Disallow` here would make
 * that link a dead end for anything reading the site rather than clicking it.
 *
 * The sitemap is named absolutely because `robots.txt` has no base to resolve
 * a relative path against; `brand.origin` is the same fact `metadataBase` in
 * `app/layout.tsx` reads, so the two can never point at different hosts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${brand.origin}/sitemap.xml`,
  };
}
