import { artTransform, boxOf, frame } from "@/lib/circuit/wokwi";
import { ResistorArtwork } from "@/components/canvas/parts/wokwi/resistor-artwork";

/**
 * C-10 · Resistor
 *
 * Wokwi's axial resistor (MIT). The bands are computed from `ohms` rather than
 * drawn, so the drawing cannot disagree with the value the build calls for: the
 * 220Ω in series with each LED comes out red–red–brown, which is what a learner
 * reads off the one in their hand.
 */
export function Resistor({
  x,
  y,
  ohms = 220,
  rotate = 0,
}: {
  x: number;
  y: number;
  /** Resistance in ohms — this is what colours the bands. */
  ohms?: number;
  /** Degrees, about the body centre. */
  rotate?: number;
}) {
  const { width, height } = boxOf(frame.resistor);

  return (
    <g
      style={{
        transform: `rotate(${rotate}deg)`,
        transformOrigin: `${x + width / 2}px ${y + height / 2}px`,
      }}
    >
      <g transform={artTransform(frame.resistor, { x, y })}>
        <ResistorArtwork ohms={ohms} />
      </g>
    </g>
  );
}
