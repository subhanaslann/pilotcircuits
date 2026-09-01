import { soapComplete, soapEmpty } from "@/lib/circuit/touchless-soap";
import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter five, building itself.
 *
 * The contract is chapter one's and is written out in `lamp-assembly.ts` and
 * `assembly.ts`: six beats, absolute `atMs`, a whole placement per beat, no
 * sentence anywhere near this file, and no beat derived from the one before it.
 * Every partial frame spreads `soapEmpty` and names every lead it means, and
 * every seat it names is read out of `soapComplete`.
 *
 * ## Measure first, then move
 *
 * The order is the sketch's: the board has to know how far away a hand is
 * before there is anything for the pump to do about it. So the sensor lands
 * whole on its own beat — four leads, two of them going straight to the board
 * on their own wire, which is the picture of a measurement that does not touch
 * the breadboard at all — and the servo follows.
 *
 * The lamp arrives with the servo rather than taking a beat of its own. By the
 * fifth chapter it is the same three parts in the same three columns for the
 * fourth time, and a film that spent a beat and a half on it would be saying
 * this is new. `entering` names the servo, because that is what the caption is
 * about and what the eye follows down.
 *
 * ## Upload, then wave
 *
 * `trace` belongs on `upload` and never on a beat that closes a join
 * (lamp-assembly.ts:104-109). It runs `tsd.c.sensor.echo` — the wire the
 * board's answer comes back on, which is the one connection that *is* this
 * chapter: the trigger goes out, and this is what returns.
 *
 * `wave` lights the lamp, and its caption says the servo is TOLD where to go
 * rather than that it turns. `AssemblyBeat` carries a placement and a `lit`
 * flag, not an angle, so a caption about a turn would be describing something
 * no frame draws — and this chapter's whole point is that being told a position
 * is the new thing. The turn itself belongs to the functional test, where a
 * person can watch it happen.
 */

/** Chapter five's six, kept closed the way every other chapter keeps its own. */
export type SoapBeatId =
  "bench" | "power" | "sense" | "pump" | "upload" | "wave";

/** Chapter one's rhythm exactly: 700, then pairs of 1500 and 1200. */
export const soapAssembly: readonly AssemblyBeat[] = [
  { id: "bench", atMs: 0, placement: soapEmpty },
  {
    id: "power",
    atMs: 700,
    placement: {
      ...soapEmpty,
      "wire.power.rail": soapComplete["wire.power.rail"],
      "wire.power.pin": soapComplete["wire.power.pin"],
      "wire.ground.rail": soapComplete["wire.ground.rail"],
      "wire.ground.pin": soapComplete["wire.ground.pin"],
    },
    entering: "wirePower",
  },
  {
    id: "sense",
    atMs: 2200,
    placement: {
      ...soapEmpty,
      "wire.power.rail": soapComplete["wire.power.rail"],
      "wire.power.pin": soapComplete["wire.power.pin"],
      "wire.ground.rail": soapComplete["wire.ground.rail"],
      "wire.ground.pin": soapComplete["wire.ground.pin"],
      "sensor.vcc": soapComplete["sensor.vcc"],
      "sensor.gnd": soapComplete["sensor.gnd"],
      "sensor.trig": soapComplete["sensor.trig"],
      "sensor.echo": soapComplete["sensor.echo"],
    },
    entering: "sensor",
  },
  {
    id: "pump",
    atMs: 3400,
    /* The servo and the lamp together, which is the whole rest of the build, so
       the frame is `soapComplete` itself rather than nine more lines that would
       have to be checked against it by hand. */
    placement: soapComplete,
    entering: "servo",
  },
  {
    id: "upload",
    atMs: 4900,
    placement: soapComplete,
    trace: "tsd.c.sensor.echo",
  },
  {
    id: "wave",
    atMs: 6100,
    placement: soapComplete,
    /* One lamp, one flag. The horn is not here: `AssemblyBeat` has no angle,
       and the briefing draws the build rather than running it — the sweep is
       the functional test's, where a person can watch it happen. */
    lit: true,
  },
] satisfies readonly (AssemblyBeat & { id: SoapBeatId })[];
