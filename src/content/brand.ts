/**
 * F-10 · Brand layer.
 *
 * The name may change, so nothing in the UI hardcodes it. Every surface reads
 * from here, and renaming the product is a one-line edit. The claim has been
 * tested and was found to be nearly true: a rename caught two share-summary
 * strings in the locale files still spelling the name out by hand. They read
 * `brand.name` now, so the promise this comment makes is one the code keeps.
 *
 * Identity only. The tagline, the category and the description are sentences
 * about the product, not the product's name — they live in `copy.brand` and
 * change with the language. `PilotCircuits`, `Build Coach` and `WebMCP` do not.
 */

export const brand = {
  name: "PilotCircuits",
  /** The in-product persona of the agent shown in the workbench right panel. */
  agentName: "Build Coach",
  /** Protocol the page exposes its tools through. */
  protocol: "WebMCP",
  /**
   * Where the product lives, for the things a relative path cannot answer.
   *
   * Social cards and canonical links are resolved by crawlers that never saw
   * the page they came from, so those URLs have to be absolute — `metadataBase`
   * in `app/layout.tsx` is what makes them so. Held here rather than in an env
   * var because it is the same on every deployment and it is the brand's own
   * fact, like the name beside it.
   */
  origin: "https://pilotcircuits.com",
} as const;

export type Brand = typeof brand;
