import { lampComplete, lampEmpty } from "@/lib/circuit/breathing-lamp";
import type { AssemblyBeat } from "@/lib/circuit/assembly";

/**
 * Chapter one, building itself.
 *
 * The six beats the briefing plays before it hands the bench over. Data, not
 * a component and not a clock: the same split `test-run.ts` and
 * `test-overlay.tsx` already keep, one file further out. The clock belongs to
 * whoever is playing this — which for the briefing is the briefing itself,
 * because unlike the functional test it leaves no record behind and nothing
 * outside the window ever has to know it ran.
 *
 * **No sentences here.** Each beat carries an `id`, and the caption is looked
 * up from the dictionary against it — the same contract `steps.ts` keeps, and
 * the reason a briefing already on screen changes language with everything
 * else rather than freezing in the one it opened in. `BeatId` is no longer the
 * key type of `BriefingWords.assembly` — chapter two's film has ids of its own
 * and neither chapter can be made to owe the other's captions — so a beat
 * added here without its caption in both locales now fails at `next dev` boot
 * instead of at compile time. `assembly.ts` records why the guarantee moved,
 * and `briefings.ts` is where it landed.
 *
 * **Each beat carries a whole placement.** The scene is `lampSceneFrom(beat)`,
 * so what the assembly draws is produced by the same function the bench is,
 * and it is impossible for the two to disagree about what a finished lamp
 * looks like. The old planted fault made this dangerous — the opening scene
 * had the lead in `D8`, so an assembly drawn from it would have ended with the
 * lamp blinking, teaching the wrong ending in the one frame that is a promise.
 * There is no such scene to reach for now.
 *
 * **The join is its own act.** `reach` and `bridge` used to be one beat: the
 * resistor arrived and the middle join appeared inside the same 350ms. That is
 * exactly the elision the bench, one screen later, asks the learner not to
 * make — a film in which the circuit closes itself teaches that closing it is
 * not anybody's job. It is also the one change in the whole film that is *only*
 * a cable: `bl.c.cathode` is never drawn at all, because the LED standing in
 * GND is that join, and `bl.c.pin`'s 55-unit leg arrives already bent into D9
 * under the resistor that is landing on it. Share a beat with a part and the
 * cable is the thing nobody was looking at.
 *
 * No beat is built from the beat before it: the partial frames spread
 * `lampEmpty` and name every lead they mean, and the finished ones are
 * `lampComplete` itself. So a join can only appear in a frame whose own literal
 * puts it there, and a stale edge cannot ride along into a picture that has not
 * earned it. `reach` seats `res.out` in D9 **before** the join is made, which
 * keeps the whole film on hole-anchored geometry: the briefing never depends on
 * a part being positioned by hanging off another part's lead.
 */

/**
 * Chapter one's six, still closed.
 *
 * The shape of a beat is shared (`assembly.ts`) and its `id` is a string, so
 * this union is what keeps chapter one's film to the ids chapter one's
 * dictionary answers for — see the `satisfies` on `lampAssembly`.
 */
export type BeatId =
  "board" | "seat" | "reach" | "bridge" | "upload" | "breathe";

/**
 * A little over a second a beat, and the beats pair up.
 *
 * Each pair is 1500ms then 1200ms: `reach` puts the resistor on the bench and
 * `bridge` closes the gap it left; `upload` sends the sketch and `breathe` is
 * what the sketch does. The second half of a pair is the consequence of the
 * first and reads faster than it — the eye is already on the thing that
 * changes, so the extra 300ms there would be a pause rather than a beat. The
 * opening 700 is shorter than either, because `board` is the caption for a
 * frame nobody has to look for anything in.
 *
 * Slower than it needs to be to be understood and slower than the functional
 * test, on purpose: the test is read off a dock while it runs, and this is
 * watched. Each part's own arrival is 350ms — rule 6's band — so the pace comes
 * from the spacing rather than from any one move being slow.
 *
 * The annotation is the shape the briefing consumes; the `satisfies` under the
 * array is the narrower promise this chapter makes to its own dictionary, and
 * with `BriefingWords.assembly` keyed by string it is the only thing left
 * holding these six ids to the six captions written for them.
 */
export const lampAssembly: readonly AssemblyBeat[] = [
  { id: "board", atMs: 0, placement: lampEmpty },
  {
    id: "seat",
    atMs: 700,
    /* The short leg only. The long one is loose from here until `bridge`, which
       is the whole point of splitting the beat and is what the caption says. */
    placement: { ...lampEmpty, "led.cathode": lampComplete["led.cathode"] },
    entering: "led",
  },
  {
    id: "reach",
    atMs: 2200,
    placement: {
      ...lampEmpty,
      "led.cathode": lampComplete["led.cathode"],
      "res.out": lampComplete["res.out"],
    },
    entering: "resistor",
  },
  {
    id: "bridge",
    atMs: 3400,
    /* Adds one edge to the frame before it — `led.anode -> res.in` — and
       nothing else arrives, so the only thing that changes on screen is the
       cable. No `trace`: the green pulse is C-22's success mark, spent once at
       `upload` to mean current is flowing now. A join that announced itself
       that way would say the circuit works before the sketch is on the board. */
    placement: lampComplete,
  },
  {
    id: "upload",
    atMs: 4900,
    placement: lampComplete,
    trace: "bl.c.pin",
  },
  {
    id: "breathe",
    atMs: 6100,
    placement: lampComplete,
    breathing: true,
  },
] satisfies readonly (AssemblyBeat & { id: BeatId })[];
