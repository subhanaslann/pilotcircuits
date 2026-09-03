import { PITCH } from "@/lib/circuit/geometry";
import { artTransform, boxOf, frame } from "@/lib/circuit/wokwi";
import { bench } from "@/components/illustration/spec";
import { LedArtwork } from "@/components/canvas/parts/wokwi/led-artwork";

/**
 * C-09 · LED
 *
 * Wokwi's 5 mm through-hole LED (MIT). Polarity is drawn rather than
 * colour-coded — the anode leg is the long one on the right and the cathode is
 * the short one on the left, exactly as on the real part — so a learner who
 * cannot tell red from green still gets the leg right (rule 7).
 *
 * `lit` drives the drawing's own glow instead of the halo we used to pulse
 * behind it. The glow is two blurred ellipses inside the dome, so a lit LED
 * reads as the bulb being on rather than as a highlight the interface has put
 * around a part.
 */
/**
 * The breath, in one class.
 *
 * `motion-safe:` like every other looping animation in the product, and the
 * caller has to say what a still lamp means: under reduced motion chapter one
 * draws it lit and steady and puts the fact in words, because a *breathing*
 * lamp frozen mid-cycle is the one frame of that chapter that cannot survive
 * being still.
 */
const BREATHE =
  "motion-safe:animate-[cp-breathe_2400ms_var(--ease-in-out-soft)_infinite]";

export function Led({
  x,
  y,
  colour,
  uid = `led-${colour}`,
  lit = false,
  breathing = false,
  label,
}: {
  x: number;
  y: number;
  /**
   * Three, because a traffic light is three. `led-artwork.tsx` already carries
   * the glow for each — `yellow: "#ffff80"` was in the port from the day it
   * landed — so this is the union catching up with the drawing.
   */
  colour: "green" | "red" | "yellow";
  /**
   * What this LED's blur filters are called.
   *
   * `LedArtwork` builds two `<filter id>` out of it, and this used to be the
   * whole of their uniqueness — which never quite worked: SVG filter ids are
   * document-global, and a red lamp on the bench and a red one being carried
   * off the kit shelf were both `led-red`, so one glow won for both. The id is
   * scoped by the drawn copy's own `useSvgPrefix()` now, and this stays as the
   * readable half of it.
   */
  uid?: string;
  lit?: boolean;
  /** Swelling and fading rather than simply on — chapter one's whole point. */
  breathing?: boolean;
  label?: string;
}) {
  const { width } = boxOf(frame.led);

  return (
    <g>
      <g transform={artTransform(frame.led, { x, y })}>
        {/* `uid` names this LED's blur filters; the drawing scopes them. */}
        <LedArtwork
          color={colour}
          value={lit || breathing}
          uid={uid}
          glowClass={breathing ? BREATHE : undefined}
        />
      </g>

      {label ? (
        <text
          x={x + width / 2}
          y={y - PITCH * 0.4}
          textAnchor="middle"
          fill={bench.label}
          className="font-mono"
          style={{ fontSize: PITCH * 0.6 }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
