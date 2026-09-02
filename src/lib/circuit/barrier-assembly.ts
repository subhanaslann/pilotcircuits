import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter six, explaining itself.
 *
 * Every other chapter's film is an **assembly**: parts arrive on the bench one
 * beat at a time and the placement in each beat says what is on it. This
 * chapter arrives built — the author lays it out, there is no kit and no
 * placement to grow (`agent/builds.ts`) — so a film of it assembling itself
 * would be a film of something that never happens here.
 *
 * What it plays instead is the **signal**, which is the thing this chapter is
 * actually about: out of the board, through the sensor, back in on the wire the
 * whole chapter turns on, then to the lamps and the horn. One pulse per beat,
 * along one connection, in the order the sketch uses them.
 *
 * ## Why every placement is empty
 *
 * `AssemblyBeat` carries a whole placement because the player draws
 * `sceneFrom(beat.placement)` — the same function the bench is drawn by, so a
 * frame cannot invent a join. This build has no such function: its scene is
 * built once, from a static table, and its briefing row hands the player a
 * `sceneFrom` that ignores what it is given and returns the finished machine.
 * The empty literal is therefore not a placeholder to be filled in later; it is
 * the honest value for a build whose picture does not depend on one.
 *
 * ## The traces are ids, and the ids are the build's
 *
 * Each `trace` names a connection in `smart-parking-barrier.ts`. A name no
 * connection owns simply draws no pulse, so the film degrades to a still
 * rather than to an error — but the six here are the six the sketch runs, and
 * the briefing plays them against the build's `reference`, where Echo is on
 * D7. The bench behind the window is the same machine with that lead one hole
 * out. That difference is the chapter.
 */

/** Chapter six's six, kept closed the way every other chapter keeps its own. */
export type BarrierBeatId =
  | "bench"
  | "power"
  | "ping"
  | "echo"
  | "decide"
  | "sweep";

/** Chapter one's rhythm, one beat slower on the two that carry the lesson. */
export const barrierAssembly: readonly AssemblyBeat[] = [
  { id: "bench", atMs: 0, placement: {} },
  { id: "power", atMs: 900, placement: {}, trace: "c.rail.pos" },
  { id: "ping", atMs: 2400, placement: {}, trace: "c.sensor.trig" },
  { id: "echo", atMs: 4000, placement: {}, trace: "c.sensor.echo" },
  { id: "decide", atMs: 5600, placement: {}, trace: "c.led.green" },
  { id: "sweep", atMs: 7100, placement: {}, trace: "c.servo.signal" },
];
