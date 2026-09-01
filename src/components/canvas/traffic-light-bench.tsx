import { boxOf, frame } from "@/lib/circuit/wokwi";
import { lightArtOrigins } from "@/lib/circuit/traffic-light";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import type { BenchSpec } from "@/components/canvas/breadboard-bench";

/**
 * Chapter two's bench, as a table.
 *
 * Everything here was inline in `traffic-light-scene.tsx` — the three lamp
 * colours, the two boxes, the four cables and their roles, and the draw order.
 * The behaviour is unchanged and must stay so: this file exists to make the
 * *view* generic, not to make chapter two different.
 *
 * Two things are load-bearing and easy to lose:
 *
 *   · **The order.** Resistors before lamps, then the cables. A rigid part's
 *     grab rect covers its whole box and an LED lies in the row above its own
 *     resistor, so drawn the other way round the lens would sit under a
 *     transparent rectangle belonging to the part beneath it.
 *   · **`a` is the end named first in the build's `terminalsOf`.** The record,
 *     the anchor and the drawing all have to agree about which end of a cable
 *     is "the" end, and the strand layer matches a cable's joins on `from`.
 */

/** Which of the three lamps the sketch is driving, if any. */
export type TrafficLive =
  | { red: boolean; yellow: boolean; green: boolean }
  | undefined;

const LED_BOX = boxOf(frame.led);
const RESISTOR_BOX = boxOf(frame.resistor);

/** The three lamps, and the one thing the drawing needs to tell them apart. */
const LAMPS = [
  { part: "ledRed", colour: "red" },
  { part: "ledYellow", colour: "yellow" },
  { part: "ledGreen", colour: "green" },
] as const;

export const lightBench: BenchSpec<TrafficLive> = {
  origins: (scene) => {
    const at = lightArtOrigins(scene);
    return {
      board: at.board,
      breadboard: at.breadboard,
      /* Cables are deliberately absent — a cable has no drawn box, so there is
         no corner for one to be the top-left of, and its ends grip themselves.
         `lightArtOrigins` answers for them too; the view recomputes a cable's
         two ends off the graph and never reads those entries. */
      parts: {
        resRed: at.resRed,
        resYellow: at.resYellow,
        resGreen: at.resGreen,
        ledRed: at.ledRed,
        ledYellow: at.ledYellow,
        ledGreen: at.ledGreen,
      },
    };
  },
  parts: [
    ...(["resRed", "resYellow", "resGreen"] as const).map((part) => ({
      id: part,
      body: {
        kind: "rigid" as const,
        box: RESISTOR_BOX,
        draw: (pos: { x: number; y: number }) => (
          <Resistor x={pos.x} y={pos.y} ohms={220} />
        ),
      },
    })),
    ...LAMPS.map(({ part, colour }) => ({
      id: part,
      body: {
        kind: "rigid" as const,
        box: LED_BOX,
        draw: (pos: { x: number; y: number }, live: TrafficLive) => (
          <Led
            x={pos.x}
            y={pos.y}
            colour={colour}
            lit={live?.[colour] ?? false}
            /* The part id, so each lamp's two blur filters say which lamp they
               belong to. Keeping them apart is the copy's `useSvgPrefix()`. */
            uid={part}
          />
        ),
      },
    })),
    {
      id: "wireGnd",
      body: {
        kind: "cable",
        ends: ["wire.gnd.rail", "wire.gnd.pin"],
        role: "ground",
      },
    },
    {
      id: "wireRed",
      body: {
        kind: "cable",
        ends: ["wire.red.row", "wire.red.pin"],
        role: "signal",
      },
    },
    {
      id: "wireYellow",
      body: {
        kind: "cable",
        ends: ["wire.yellow.row", "wire.yellow.pin"],
        role: "signal",
      },
    },
    {
      id: "wireGreen",
      body: {
        kind: "cable",
        ends: ["wire.green.row", "wire.green.pin"],
        role: "signal",
      },
    },
  ],
  /* Every correction in this chapter is a hole, so the plastic prints the
     addresses a person is told out loud. */
  holeAddresses: true,
};
