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
bindings dropped, `<defs>` ids prefixed per part so two parts in one document
cannot capture each other's gradients and filters.

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
