# Wokwi Elements, ported

The bought parts on the circuit canvas — the board, the sensor, the servo, the
LED and the resistor — are [Wokwi Elements][wokwi] drawings carried over into
React. `LICENSE` in this folder is the upstream MIT licence and must stay with
these files.

| File | Upstream element |
| --- | --- |
| `arduino-uno-artwork.tsx` | `wokwi-arduino-uno` |
| `hc-sr04-artwork.tsx` | `wokwi-hc-sr04` |
| `pir-motion-sensor-artwork.tsx` | `wokwi-pir-motion-sensor` |
| `servo-artwork.tsx` | `wokwi-servo` |
| `led-artwork.tsx` | `wokwi-led` |
| `resistor-artwork.tsx` | `wokwi-resistor` |
| `helpers.ts` | horn geometry + resistor colour code |

Ported from `wokwi/wokwi-elements@0125fbc` (6 Aug 2026); the PIR motion
sensor was added in a later pass against the same upstream, which regenerated
the other four byte for byte.

## Why ported instead of installed

`@wokwi/elements` is on npm, and taking the dependency would have been less
work. It would also have put every part inside a Lit custom element, and:

- a custom element cannot go inside our scene's `<svg>` without a
  `foreignObject`, which does not survive the viewport's pan and zoom cleanly;
- inside one, the drawing sits in a shadow root, out of reach of the dim,
  ghost and highlight states the canvas paints parts with;
- the parts would carry a runtime and a second rendering model into a codebase
  that already draws everything as plain SVG.

Ported, each part is a `<g>` like anything else we draw.

## What is not here

There is no breadboard and there are no jumper wires: Wokwi has no breadboard
element ([wokwi-elements#31][issue], open since 2020) and draws its wires in
the closed simulator. Both are ours, in `../breadboard.tsx` and `../wire.tsx`.

## Regenerating

`scripts/port-wokwi.py` re-runs the conversion against a fresh checkout of the
upstream repo:

```
python scripts/port-wokwi.py --dest src/components/canvas/parts/wokwi
```

It converts each element's Lit template into JSX: attributes to camelCase, lit
bindings dropped, and every `<defs>` id scoped to the drawn copy — the
component's own `useSvgPrefix()` first, then the part's name — so neither two
parts nor two copies of one part can capture each other's gradients, patterns,
filters and clip paths.

That second half was missing until the ids were audited, and it was not
theoretical: chapter two's bench draws three resistors, so `res-a`, `res-body`
and `res-g` were each defined three times and all 23 `url(#…)` references on the
page resolved to the first resistor. Worse, chapter one's briefing draws the
resistor at two scales in two `<svg>` roots, and there the shared `clipPath`
dropped two of the four colour bands outright — a 220 Ω resistor came out red ·
brown. If you re-port, keep the scoping: a fixed id is a fixed id however many
parts share the name.

Three things it does **not** carry, because they are TypeScript rather than
SVG, and so are maintained by hand here:

- `helpers.ts` — the horn paths and the resistor colour code;
- `led-artwork.tsx` — upstream wraps the LED in a `<div>` with a label span,
  and only the inner `renderSVG()` is wanted;
- `@/lib/circuit/wokwi.ts` — the frames and the `pinInfo` tables. **If you
  re-port, check these against upstream in the same pass.** They are what makes
  a drawn hole and a graph pin the same point; if they drift, wires will end
  next to pins instead of in them, and nothing will fail loudly.

[wokwi]: https://github.com/wokwi/wokwi-elements
[issue]: https://github.com/wokwi/wokwi-elements/issues/31
