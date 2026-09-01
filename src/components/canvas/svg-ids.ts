import { useId } from "react";

/**
 * One drawn copy's own id space.
 *
 * SVG `id`s are document-global and `url(#…)` resolves against the whole page,
 * not against the `<svg>` it is written in. Every drawing here defines gradients,
 * patterns, filters and clip paths under fixed names, so a bench with three
 * resistors on it defined `res-body` three times and all three `url(#res-body)`
 * resolved to the first one. Prefixing by part type — which is what the ported
 * artwork did — separates a resistor from a board and does nothing at all for
 * the second resistor.
 *
 * It is not only a tidiness problem. Chapter one's briefing draws the resistor
 * twice at two scales: the kit-shelf tile on a `0 0 61.6 11.8` viewBox and the
 * stage on a `330 241 386 449` one. A `clipPath` shared between them is applied
 * in the *referencing* element's user space, so the two clipped colour bands
 * landed outside the shape they were clipping and simply were not drawn — a
 * 220 Ω resistor with two bands instead of four.
 *
 * So the prefix has to come from the copy, not from the part, and `useId` is
 * what React has that is stable across server render and hydration.
 *
 * The value is sanitised because React 19 wraps its ids in guillemets (`«R1»`)
 * — legal in an XML id, awkward in a `url()` and rejected by
 * `querySelectorAll`. Each character maps to exactly one character, so two ids
 * React kept apart stay apart.
 *
 * Use it as the first segment of every id a drawing defines, and build every
 * reference to those ids from the same value:
 *
 * ```tsx
 * const uid = useSvgPrefix();
 * <clipPath id={`${uid}-res-g`}>…</clipPath>
 * <rect clipPath={`url(#${uid}-res-g)`} />
 * ```
 */
export function useSvgPrefix(): string {
  return useId().replace(/[^A-Za-z0-9]/g, "_");
}
