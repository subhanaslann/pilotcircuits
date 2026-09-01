import { plantComplete, plantEmpty } from "@/lib/circuit/plant-guardian";
import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter four, building itself.
 *
 * The contract is chapter one's and is written out in `lamp-assembly.ts` and
 * `assembly.ts`: six beats, absolute `atMs`, a whole placement per beat, no
 * sentence anywhere near this file, and no beat derived from the one before it.
 * Every partial frame spreads `plantEmpty` and names every lead it means, and
 * every seat it names is read out of `plantComplete` rather than typed as a
 * hole id.
 *
 * ## Why it opens the same way chapter three does
 *
 * Because it is the same opening move on a bench that has been turned over.
 * Two rails, dead until a cable reaches each of them — and this time the cables
 * come DOWN from a board sitting above the breadboard, which is the first thing
 * the film has to make legible. Somebody arriving from chapter three will look
 * for the Uno where they left it; the empty bench is the frame that answers
 * that, and the power beat is the one that explains why it moved.
 *
 * ## Why the probe, then the lamp
 *
 * The chapter's subject is the number, so the thing that produces the number
 * goes on first — and it lands whole, three leads and the cable that carries
 * its answer, because a probe with two of three leads in is a picture of an
 * interruption rather than of a part.
 *
 * The lamp then arrives as one group, the way chapter three's does. By here it
 * is the third time a person has built it and the film should say so by taking
 * one beat over it rather than three.
 *
 * ## Upload, then dry
 *
 * `trace` belongs on `upload` and never on a beat that closes a join
 * (lamp-assembly.ts:104-109). It runs `pg.c.signal.pin` — the cable carrying
 * the probe's answer into `A0` — because that is the one connection that *is*
 * this chapter: a wire whose voltage is a number rather than a yes.
 *
 * `dry` lights the lamp, which is the chapter's promise: nobody watered the
 * plant, the reading fell past the value you chose, and the light came on
 * without anything else happening.
 */

/**
 * Chapter four's six, kept closed the way every other chapter keeps its own.
 *
 * `AssemblyBeat.id` is a string so that two chapters can have different beats
 * without owing each other captions; this union holds these six to the six
 * `assembly.*` entries written for them in both locales, and the dev-boot check
 * in `briefings.ts` holds those entries to this list.
 */
export type PlantBeatId =
  "bench" | "power" | "probe" | "lamp" | "upload" | "dry";

/** Chapter one's rhythm exactly: 700, then pairs of 1500 and 1200. */
export const plantAssembly: readonly AssemblyBeat[] = [
  { id: "bench", atMs: 0, placement: plantEmpty },
  {
    id: "power",
    atMs: 700,
    placement: {
      ...plantEmpty,
      "wire.power.rail": plantComplete["wire.power.rail"],
      "wire.power.pin": plantComplete["wire.power.pin"],
      "wire.ground.rail": plantComplete["wire.ground.rail"],
      "wire.ground.pin": plantComplete["wire.ground.pin"],
    },
    entering: "wirePower",
  },
  {
    id: "probe",
    atMs: 2200,
    /* Names the two supply cables again rather than building on the frame
       before it — the price of every frame being a whole placement, and the
       price that stops a stale edge riding into a picture. */
    placement: {
      ...plantEmpty,
      "wire.power.rail": plantComplete["wire.power.rail"],
      "wire.power.pin": plantComplete["wire.power.pin"],
      "wire.ground.rail": plantComplete["wire.ground.rail"],
      "wire.ground.pin": plantComplete["wire.ground.pin"],
      "soil.vcc": plantComplete["soil.vcc"],
      "soil.gnd": plantComplete["soil.gnd"],
      "soil.aout": plantComplete["soil.aout"],
      "wire.signal.row": plantComplete["wire.signal.row"],
      "wire.signal.pin": plantComplete["wire.signal.pin"],
    },
    entering: "probe",
  },
  {
    id: "lamp",
    atMs: 3400,
    /* The lamp group is the whole rest of the build, so the frame is
       `plantComplete` itself rather than nine more lines that would have to be
       checked against it by hand. */
    placement: plantComplete,
    entering: "ledPlant",
  },
  {
    id: "upload",
    atMs: 4900,
    placement: plantComplete,
    trace: "pg.c.signal.pin",
  },
  {
    id: "dry",
    atMs: 6100,
    placement: plantComplete,
    /* `lit` and not `breathing`: this lamp is on or off, and the chapter is
       about which side of a number it is on. */
    lit: true,
  },
] satisfies readonly (AssemblyBeat & { id: PlantBeatId })[];
