import { layout } from "@/lib/circuit/geometry";
import { artTransform, frame } from "@/lib/circuit/wokwi";
import { Hcsr04Artwork } from "@/components/canvas/parts/wokwi/hc-sr04-artwork";

/**
 * C-07 · Ultrasonic distance sensor
 *
 * Wokwi's HC-SR04 (MIT): two transducer cans, the crystal between them, and the
 * four-pin header with VCC/TRIG/ECHO/GND printed down it — the same strings the
 * real part carries, which is what the user reads when the agent says "the Echo
 * pin".
 *
 * Like the board, it carries no labels of ours: four names on a 10 px pitch ran
 * together, and the part had already said all four. The correction overlay owns
 * the words.
 */
export function UltrasonicSensor({
  at = layout.ultrasonic,
}: {
  /**
   * Where the module sits.
   *
   * Defaults to the capstone's slot, which is the one build that has an opinion
   * about it in `geometry.ts`. A chapter that lays out its own bench passes its
   * own — the same contract `UnoBoard` and `Breadboard` already take.
   */
  at?: { x: number; y: number };
} = {}) {
  return (
    <g transform={artTransform(frame.sensor, at)}>
      <Hcsr04Artwork />
    </g>
  );
}
