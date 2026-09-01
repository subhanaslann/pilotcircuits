import { layout } from "@/lib/circuit/geometry";
import { artTransform, frame } from "@/lib/circuit/wokwi";
import { UnoArtwork } from "@/components/canvas/parts/wokwi/arduino-uno-artwork";

/**
 * C-03 · C-04 · C-05 — the board, its headers, and their labels.
 *
 * The drawing is Wokwi's Arduino Uno (MIT), placed by {@link artTransform} so
 * the top-left of its rendered box lands on `layout.board`. That is the same
 * corner its `pinInfo` is measured from, which is why the pins the graph hands
 * out land exactly on the holes in the artwork without a fudge factor.
 *
 * There are no pin labels here any more, and that is the point. The board
 * prints all nineteen itself, in the right places, at the right size — so ours
 * were a second copy on a 9.5 px pitch, and `3V3 5V GND GND VIN` ran together
 * into one illegible smear along the bottom edge. Even reduced to just the pin
 * under discussion they collided, because the pin under discussion is usually
 * D6 *and* D7, one pitch apart. That is the knot `pin-rings.tsx` was written to
 * avoid: the marks on the pins carry no text and the words go out to a single
 * callout with leader lines. This part now follows the same rule.
 */
export function UnoBoard({
  at = layout.board,
}: {
  /**
   * Top-left of the board's rendered box. Defaults to the capstone's slot;
   * chapter one stands its parts in the header and lays the board out from its
   * own module, so it passes its own.
   */
  at?: { x: number; y: number };
}) {
  return (
    /* Hidden from assistive tech: the silkscreen — DIGITAL (PWM ~), ANALOG IN,
       the pin numbers, ARDUINO UNO — is a picture of the board. The pins a
       person needs are named in the step rail and in every finding sentence. */
    <g transform={artTransform(frame.uno, at)} aria-hidden="true">
      {/* The board is powered for the whole demo; L is not modelled. */}
      <UnoArtwork ledPower />
    </g>
  );
}
