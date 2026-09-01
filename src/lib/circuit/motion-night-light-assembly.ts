import { nightComplete, nightEmpty } from "@/lib/circuit/motion-night-light";
import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter three, building itself.
 *
 * The contract is chapter one's and is written out in `lamp-assembly.ts` and
 * `assembly.ts`: six beats, absolute `atMs`, a whole placement per beat, no
 * sentence anywhere near this file, and no beat derived from the one before it.
 * Every partial frame spreads `nightEmpty` and names every lead it means, and
 * every seat it names is read out of `nightComplete` rather than typed as a
 * hole id — so the film cannot come to disagree with the finished build about
 * where anything goes.
 *
 * ## Why power comes first, and is a beat of its own
 *
 * Chapter two opened with ground because its `−` rail was dead metal until a
 * cable reached GND. This chapter has two dead rails, and the second one is
 * the thing that is new: nothing before this needed 5 V. So the first beat
 * after the empty bench is the pair of cables that make the rails mean
 * something, and everything after it hangs off them — which is also the order
 * the bench asks for it in, `mnlPower` being step two.
 *
 * It is also where the person watches a cable leave the board's OTHER edge for
 * the first time. That is worth its own beat and its own caption: the power
 * header is a part of the Uno that four chapters have drawn and none has used.
 *
 * ## Why the sensor before the lamp
 *
 * Because it is the chapter. A night light is a lamp that waits, and the film
 * has to introduce the waiting before the lamp — otherwise the last beat looks
 * like chapter one with a sensor attached to it, which is exactly the reading
 * the ladder is trying to avoid. The sensor's three leads and the cable that
 * carries its answer to `D2` land together: they are one act, and a module with
 * two of three leads in is a picture of an interruption.
 *
 * The lamp then lands whole, the way chapter two's red group does, and for the
 * same reason — there is no lead-to-lead join in this chapter, so no beat
 * leaves a gap on screen for a later one to close.
 *
 * ## Upload, then wake
 *
 * `trace` belongs on `upload` and never on a beat that closes a join
 * (lamp-assembly.ts:104-109): a green success pulse on a join says the circuit
 * works before the sketch is on the board. It runs `mnl.c.signal.pin` — the
 * cable that carries the sensor's answer into `D2` — because that is the one
 * connection that *is* this chapter, and because a pulse travelling from the
 * breadboard to the board is the direction this build's information actually
 * moves in. Every other chapter's trace runs the other way.
 *
 * `wake` lights the lamp, which is the whole promise of the card: somebody
 * walked past. The still a person carries out of the briefing is the sketch's
 * interesting frame rather than its resting one.
 */

/**
 * Chapter three's six, kept closed the way the other chapters keep theirs.
 *
 * `AssemblyBeat.id` is a string so that two chapters can have different beats
 * without owing each other captions; this union is what holds these six to the
 * six `assembly.*` entries written for them in both locales, and the dev-boot
 * check in `briefings.ts` is what holds those entries to this list.
 */
export type NightBeatId =
  "bench" | "power" | "sense" | "lamp" | "upload" | "wake";

/**
 * Chapter one's rhythm exactly: 700, then pairs of 1500 and 1200.
 *
 * The same window, the same size of picture and the same viewer, who should not
 * have to relearn the pace of a film they have watched twice. The pairing
 * survives the transplant: `lamp` is the consequence of `sense` (a light that
 * comes on because something was noticed) and `wake` is what `upload` does.
 */
export const nightAssembly: readonly AssemblyBeat[] = [
  { id: "bench", atMs: 0, placement: nightEmpty },
  {
    id: "power",
    atMs: 700,
    /* Both cables, both ends, in `terminalsOf` order — the rail end is the
       anchor, so a reader comparing this literal with the topology reads them
       the same way round. */
    placement: {
      ...nightEmpty,
      "wire.power.rail": nightComplete["wire.power.rail"],
      "wire.power.pin": nightComplete["wire.power.pin"],
      "wire.ground.rail": nightComplete["wire.ground.rail"],
      "wire.ground.pin": nightComplete["wire.ground.pin"],
    },
    /* The one that is new. Ground has been in the last two chapters; a cable
       that comes up from under the board carrying five volts has not. */
    entering: "wirePower",
  },
  {
    id: "sense",
    atMs: 2200,
    /* Names the two supply cables again rather than building on the frame
       before it. Four leads written out where none would have done is the
       price of every frame being a whole placement, and it is the price that
       stops a stale edge riding into a picture. */
    placement: {
      ...nightEmpty,
      "wire.power.rail": nightComplete["wire.power.rail"],
      "wire.power.pin": nightComplete["wire.power.pin"],
      "wire.ground.rail": nightComplete["wire.ground.rail"],
      "wire.ground.pin": nightComplete["wire.ground.pin"],
      "pir.vcc": nightComplete["pir.vcc"],
      "pir.out": nightComplete["pir.out"],
      "pir.gnd": nightComplete["pir.gnd"],
      "wire.signal.row": nightComplete["wire.signal.row"],
      "wire.signal.pin": nightComplete["wire.signal.pin"],
    },
    entering: "pir",
  },
  {
    id: "lamp",
    atMs: 3400,
    /* The lamp group, which is the whole rest of the build, so the frame is
       `nightComplete` itself rather than nine more lines that would have to be
       checked against it by hand. */
    placement: nightComplete,
    entering: "ledNight",
  },
  {
    id: "upload",
    atMs: 4900,
    placement: nightComplete,
    trace: "mnl.c.signal.pin",
  },
  {
    id: "wake",
    atMs: 6100,
    placement: nightComplete,
    /* `lit` and not `breathing`: this lamp is on or it is off, and the whole
       point of the chapter is which of the two it is and why. */
    lit: true,
  },
] satisfies readonly (AssemblyBeat & { id: NightBeatId })[];
