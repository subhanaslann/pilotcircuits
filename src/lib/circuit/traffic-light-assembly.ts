import { lightComplete, lightEmpty } from "@/lib/circuit/traffic-light";
import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter two, building itself.
 *
 * The contract is chapter one's and is written out in `lamp-assembly.ts` and
 * `assembly.ts`: six beats, absolute `atMs`, a whole placement per beat, no
 * sentence anywhere near this file, and no beat derived from the one before
 * it. Every partial frame spreads `lightEmpty` and names every lead it means,
 * and every seat it names is read out of `lightComplete` rather than typed as
 * a hole id — so the film cannot come to disagree with the finished build
 * about where anything goes, and a join can only appear in a frame whose own
 * literal puts it there.
 *
 * ## Why the ground cable arrives first
 *
 * All three resistors end in the `−` rail, and the rail is dead metal until
 * one cable joins it to the Uno's GND. Build a lamp before that and the film
 * spends its best two beats on a loop that looks closed and cannot light,
 * after which the cable that actually completes it lands at the end looking
 * like a detail. Ground first makes the rail the thing every later beat hangs
 * off, which is also the order the bench asks for it in — `tlGround` is step
 * two, before any lamp.
 *
 * It is also the cable's whole introduction. The briefing has four part
 * screens because the catalogue counts four components, and a jumper is
 * deliberately not one of them; so this beat is where the first thing in the
 * product a person picks up that is not a component gets picked up.
 *
 * Both ends land together, unlike chapter one's `seat`. A cable with one end
 * loose is a real bench state — `lightSceneFrom`'s slack rule exists for it —
 * but nothing later in this film would close it, and an end left dangling for
 * a beat and a half and then quietly seated inside the next frame is exactly
 * the elision chapter one split `reach` from `bridge` to avoid.
 *
 * ## Why one lamp, then two
 *
 * The chapter is one pattern repeated three times, and the film has to *say*
 * repeated rather than perform it: three lamp beats would be eleven seconds
 * spent on one idea, and the third would teach nothing the first did not.
 * `red` is the pattern and `others` is the claim that the rest is the same
 * thing — the same cut the steps make, `tlRed` alone and then `tlOthers` for
 * both. It also lands the repetition on the beat that reads fastest, which is
 * the pacing making the same argument.
 *
 * ## Why the red group lands whole
 *
 * Chapter one split its middle join into a beat of its own because that join
 * was the act the chapter was about. There is no such act here to split off:
 * chapter two has no lead-to-lead join at all — twenty leads, twenty holes —
 * so no beat leaves a gap on screen for a later one to close, and a caption
 * pointing at the moment the circuit completed would have nothing to point at.
 * What there is to see is six leads standing in the right columns, and that is
 * one idea.
 *
 * `entering` is one part by definition, and three arrive on `red`; it names
 * the LED, because that is what the caption is about and what the eye follows
 * down. `others` names none — six parts arrive and any single answer would be
 * the wrong part coming down onto the bench.
 *
 * ## Upload, then cycle
 *
 * `trace` belongs on `upload` and never on a beat that closes a join, for the
 * reason written out at lamp-assembly.ts:104-109: a green success pulse on a
 * join says the circuit works before the sketch is on the board. It runs
 * `tl.c.red.pin` — the red lamp's cable into D13, which is the one connection
 * that *is* this chapter, a wire crossing the desk from the header to a column
 * — on the lamp the film built first.
 *
 * `cycle` lights red alone because red alone is the first state the sketch
 * actually reaches (`trafficRun`'s 900 ms beat is `Light: RED`). The still a
 * person carries out of the briefing and into the bench is then the sketch's
 * opening frame rather than a lamp test no traffic light ever performs.
 */

/**
 * Chapter two's six, kept closed the way chapter one keeps its own.
 *
 * `AssemblyBeat.id` is a string so that two chapters can have different beats
 * without owing each other captions; this union is what holds these six to the
 * six `assembly.*` entries written for them in both locales, and the dev-boot
 * check in `briefings.ts` is what holds those entries to this list.
 */
export type LightBeatId =
  "bench" | "ground" | "red" | "others" | "upload" | "cycle";

/**
 * Chapter one's rhythm exactly: 700, then pairs of 1500 and 1200.
 *
 * Not copied for the sake of it — it is the same window, the same size of
 * picture and, by the time anyone sees this, the same viewer, who should not
 * have to relearn the pace of a film they have already watched once. The
 * pairing survives the transplant without being forced: `others` is the
 * consequence of `red` (it is that beat twice more) and `cycle` is what
 * `upload` does, and the second half of a pair reads faster because the eye is
 * already on the thing that changes. The opening 700 is short because `bench`
 * is the caption for a frame nobody has to look for anything in — here, an
 * empty board and an empty breadboard, which is the whole difference from
 * chapter one's opening frame.
 */
export const lightAssembly: readonly AssemblyBeat[] = [
  { id: "bench", atMs: 0, placement: lightEmpty },
  {
    id: "ground",
    atMs: 700,
    /* Both ends, in `terminalsOf` order: the rail end is the anchor, so a
       reader comparing this literal with the topology reads them the same way
       round. */
    placement: {
      ...lightEmpty,
      "wire.gnd.rail": lightComplete["wire.gnd.rail"],
      "wire.gnd.pin": lightComplete["wire.gnd.pin"],
    },
    entering: "wireGnd",
  },
  {
    id: "red",
    atMs: 2200,
    /* Names the ground cable again rather than building on the frame before
       it. Eight leads written out where two would have done is the price of
       every frame being a whole placement, and it is the price that stops a
       stale edge from riding into a picture. */
    placement: {
      ...lightEmpty,
      "wire.gnd.rail": lightComplete["wire.gnd.rail"],
      "wire.gnd.pin": lightComplete["wire.gnd.pin"],
      "led.red.cathode": lightComplete["led.red.cathode"],
      "led.red.anode": lightComplete["led.red.anode"],
      "res.red.in": lightComplete["res.red.in"],
      "res.red.out": lightComplete["res.red.out"],
      "wire.red.row": lightComplete["wire.red.row"],
      "wire.red.pin": lightComplete["wire.red.pin"],
    },
    entering: "ledRed",
  },
  {
    id: "others",
    atMs: 3400,
    /* The amber and green groups, which is the whole rest of the build, so the
       frame is `lightComplete` itself rather than fourteen more lines that
       would have to be checked against it by hand. No `entering`: six parts
       land here and the field takes one. */
    placement: lightComplete,
  },
  {
    id: "upload",
    atMs: 4900,
    placement: lightComplete,
    trace: "tl.c.red.pin",
  },
  {
    id: "cycle",
    atMs: 6100,
    placement: lightComplete,
    /* No `lit` and no `breathing`: those two are one lamp's vocabulary, and a
       build with three lights answers only through `lamps`. */
    lamps: { red: true, yellow: false, green: false },
  },
] satisfies readonly (AssemblyBeat & { id: LightBeatId })[];
