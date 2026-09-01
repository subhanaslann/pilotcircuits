import { artTransform, frame } from "@/lib/circuit/wokwi";
import { PirMotionSensorArtwork } from "@/components/canvas/parts/wokwi/pir-motion-sensor-artwork";

/**
 * Chapter three · PIR motion sensor (HC-SR501)
 *
 * Wokwi's drawing (MIT): the white fresnel dome, the navy board under it, and
 * the three pins hanging off the bottom edge with `+`, `D` and `−` printed
 * beside them in white. Those three characters are the reason this chapter's
 * sensor leads are not interchangeable — the part tells you which is which, so
 * putting 5 V into the middle one is a mistake somebody can see and avoid.
 *
 * Like the board and the HC-SR04 it carries no labels of ours. Its own
 * silkscreen has already named all three pins, and a second set of words at a
 * 9.7 px pitch is the smear `pin-rings.tsx` exists to avoid.
 *
 * `at` is required rather than defaulted: nothing in `geometry.ts`'s `layout`
 * describes this part, because it belongs to a chapter that lays out its own
 * bench. A default would be a coordinate borrowed from the capstone's desk.
 */
export function PirSensor({ at }: { at: { x: number; y: number } }) {
  return (
    <g transform={artTransform(frame.pir, at)}>
      <PirMotionSensorArtwork />
    </g>
  );
}
