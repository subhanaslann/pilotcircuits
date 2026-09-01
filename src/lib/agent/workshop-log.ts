import type { Copy } from "@/content/i18n";
import { node, type CircuitScene } from "@/lib/circuit/graph";
import {
  smartParkingBarrier,
  withEchoFixed,
} from "@/lib/circuit/smart-parking-barrier";
import { finalReadingCm } from "@/lib/device/test-run";

/**
 * S-01 · The transcript the entry screen's terminal prints before anything has
 * happened.
 *
 * The workbench writes a real timeline (`activity.ts`) and the terminal shows
 * *that* the moment there is one. This is what stands there first — the demo
 * fallback §9 allows — and the only thing that makes it acceptable is that
 * none of it is written by hand.
 *
 * Every value is read out of the same two places the product reads them: the
 * circuit graph says which pin the servo's signal lands on and which pin the
 * Echo wire is sitting on versus the one the sketch expects, and the functional
 * test says how close the car got. So the terminal cannot advertise a pin this
 * build does not use, and the day the fault moves the transcript moves with it.
 *
 * The clock is the one invented thing here, and it is invented on purpose: a
 * timestamp read from `Date.now()` renders one value on the server and another
 * on the client, which is a hydration mismatch on the product's first screen.
 * Fixed offsets from a fixed start are the same in both passes.
 */

/** Where the transcript starts. Minutes past midnight, formatted below. */
const START = 22 * 3600 + 41 * 60 + 3;

/** `22:41:03` — two digits everywhere, in no particular timezone. */
function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Which pin a connection's board end is called, straight off the graph. */
function pinOf(scene: CircuitScene, connectionId: string): string {
  const connection = scene.observed.find((c) => c.id === connectionId);
  return (connection && node(scene, connection.to).label) || "";
}

export interface WorkshopLogLine {
  /** Preformatted, for the same reason `ActivityEntry.time` is. */
  time: string;
  /** Resolved against the dictionary at render — never stored as words. */
  say: (copy: Copy) => string;
}

/**
 * Five events, which is what a diagnostic surface shows: the servo came up, the
 * test triggered, the agent found the Echo wire on the wrong pin, it was moved,
 * the barrier is sweeping. The build's actual fault, in the actual order it is
 * met at the bench.
 */
export function demoWorkshopLog(): WorkshopLogLine[] {
  const servoPin = pinOf(smartParkingBarrier, "c.servo.signal");
  const echoFound = pinOf(smartParkingBarrier, "c.sensor.echo");
  const echoExpected = pinOf(withEchoFixed(smartParkingBarrier), "c.sensor.echo");

  const lines: [number, (copy: Copy) => string][] = [
    [0, (c) => c.landing.log.attach(servoPin)],
    [4, (c) => c.landing.log.trigger(finalReadingCm)],
    [6, (c) => c.landing.log.mistake(echoFound, echoExpected)],
    [8, (c) => c.landing.log.fixed(echoExpected)],
    [11, (c) => c.landing.log.sweep],
  ];

  return lines.map(([offset, say]) => ({ time: clock(START + offset), say }));
}

/** The pin the subtitle says the agent is watching: the servo's signal line. */
export const watchedPin = pinOf(smartParkingBarrier, "c.servo.signal");
