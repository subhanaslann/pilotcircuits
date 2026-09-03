import type { MetadataRoute } from "next";
import { brand } from "@/content/brand";
import { labBatches } from "@/content/lab-manifest";
import { projects } from "@/lib/projects/catalog";

/**
 * The site's addresses, read off the same lists the pages are built from.
 *
 * Not hand-written. A sitemap that repeats the six chapter slugs by hand is a
 * seventh place they are spelled out, and the one place nothing renders — so
 * it would go stale in silence. The slugs come from `projects`
 * (`lib/projects/catalog.ts`, where `slug` is documented as the field that
 * never changes once published) and the lab routes from `labBatches`
 * (`content/lab-manifest.ts`), which the lab navigation already reads.
 *
 * ## What is listed and what is not
 *
 * `/workbench/[slug]` and `/complete/[slug]` are left out. They are not
 * documents: a workbench is a build in progress and a completion screen is the
 * end of one, both meaningful only after somebody has started. `robots.ts`
 * still lets a crawler follow a link into them — being absent from a sitemap
 * is not a `Disallow`. What is listed is the way *in*: the entry screen, the
 * catalogue, the six chapter pages, the dashboard, and the design lab.
 *
 * `lastModified` is the build's own moment. Every route here is rendered from
 * source with no external content behind it, so a deploy is the only thing
 * that can change any of them, and that is exactly when this runs.
 *
 * Static by construction: nothing below reads a cookie or a header, so unlike
 * the product's pages this route prerenders.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const at = (path: string) => `${brand.origin}${path}`;
  const lastModified = new Date();

  return [
    { url: at("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: at("/projects"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map((project) => ({
      url: at(`/projects/${project.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: at("/workspace"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: at("/lab"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    /* The screens batch has no page of its own — its `slug` is `null` and its
       `href` is the product itself, which is already the first entry above. */
    ...labBatches
      .filter((batch) => batch.slug !== null)
      .map((batch) => ({
        url: at(`/lab/${batch.slug}`),
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.3,
      })),
  ];
}
