/**
 * F-10 · Brand layer.
 *
 * The working name may change before submission, so nothing in the UI hardcodes
 * it. Every surface reads from here. Renaming the product is a one-line edit.
 *
 * Identity only. The tagline, the category and the description are sentences
 * about the product, not the product's name — they live in `copy.brand` and
 * change with the language. `CircuitPilot`, `Build Coach` and `WebMCP` do not.
 */

export const brand = {
  name: "CircuitPilot",
  /** The in-product persona of the agent shown in the workbench right panel. */
  agentName: "Build Coach",
  /** Protocol the page exposes its tools through. */
  protocol: "WebMCP",
} as const;

export type Brand = typeof brand;
