import type { Copy } from "@/content/i18n";
import type { CoachingLevel } from "@/lib/agent/model";
import { stepWords, type StepId } from "@/lib/agent/steps";
import type { TerminalId } from "@/lib/circuit/placement";
import type { KitId } from "@/lib/projects/catalog";

/**
 * Batch 4 · A sentence the panel has not said yet.
 *
 * The timeline used to store rendered strings — `Agent inspected wiring for
 * Step 3` — written at the moment the tool ran. Switching language left them
 * standing in the language they were found in, which is the one place in the
 * product where a stale sentence is also a *false* one: the panel would be
 * claiming, in English, that the agent had said something in Turkish.
 *
 * So an entry stores the key and its arguments, and the words are looked up at
 * render. `Line` is derived from the dictionary itself, so a key that does not
 * exist, or the wrong number of arguments, is a compile error rather than an
 * `undefined` on screen.
 *
 * Arguments that are themselves translated — a step's name, a coaching level —
 * cannot be passed as text or they would freeze exactly like the sentence did.
 * They are passed as a `Ref` and resolved in the same pass.
 */

type Agent = Copy["agentPanel"];

type Namespace = "activity" | "phases" | "errors" | "user";

/** An argument that has to be looked up rather than carried. */
export type Ref =
  | { ref: "step"; id: StepId }
  | { ref: "coaching"; level: CoachingLevel }
  /**
   * A part, by name.
   *
   * `You placed the LED in D9` is half hardware and half product: the pin is
   * printed on the board and never translated, the part's *name* is the
   * dictionary's word for it. Passing the name as a string would freeze that
   * half in whichever language the person happened to be reading when they
   * moved it — the exact bug this file was written to end.
   */
  | { ref: "component"; id: KitId }
  /**
   * One lead of a part, by name — and in the grammatical case the sentence
   * around it needs.
   *
   * The same argument as `component`, one level finer: `You put the LED's long
   * leg in D9` is half hardware and half product, so the leg's *name* has to be
   * looked up at render or it freezes in whichever language it was moved in.
   *
   * The `case` is here rather than in the template because Turkish inflects the
   * name itself: a lead name is already a possessive phrase, and a template
   * cannot append `-i` or `-e` to a word it will not see until render. Every
   * other sentence in this file dodges suffixes by appending a template-owned
   * noun; a lead name is too long for that to read as anything but padding.
   */
  | { ref: "lead"; id: TerminalId; case: "nom" | "acc" | "dat" };

type Arg<T> = T extends string ? T | Ref : T;

type Args<A extends unknown[]> = { [I in keyof A]: Arg<A[I]> };

type Keyed<NS extends Namespace> = {
  [K in keyof Agent[NS]]: Agent[NS][K] extends (...args: infer A) => string
    ? { ns: NS; k: K; args: Args<A> }
    : { ns: NS; k: K };
}[keyof Agent[NS]];

export type Line =
  | Keyed<"activity">
  | Keyed<"phases">
  | Keyed<"errors">
  | Keyed<"user">;

function resolve(copy: Copy, value: unknown): unknown {
  if (typeof value !== "object" || value === null || !("ref" in value)) {
    return value;
  }
  const ref = value as Ref;
  if (ref.ref === "step") return stepWords(copy, ref.id).name;
  /* `copy.build.parts`, not `copy.components`: the catalogue's names are
     facet labels for a kit list and are plural — `LEDs` — and a sentence about
     the one part in your hand needs the singular the graph already uses when
     it says `Board → D7`. */
  if (ref.ref === "component") return copy.build.parts[ref.id];
  if (ref.ref === "lead") {
    const table =
      ref.case === "acc"
        ? copy.build.leadObject
        : ref.case === "dat"
          ? copy.build.leadTarget
          : copy.build.leads;
    /* The tables admit any string so a `TerminalId` can index them, which means
       a build whose leads are not named here falls through to the raw id —
       `res.out` in the timeline, ugly and legible, rather than a blank. */
    return table[ref.id] ?? ref.id;
  }
  return copy.agentPanel.coaching[ref.level];
}

/** The only place a `Line` becomes words. */
export function say(copy: Copy, line: Line): string {
  const entry = (copy.agentPanel[line.ns] as Record<string, unknown>)[
    line.k as string
  ];

  if (typeof entry !== "function") return entry as string;

  const args = ("args" in line ? (line.args as unknown[]) : []).map((arg) =>
    resolve(copy, arg),
  );
  return (entry as (...a: unknown[]) => string)(...args);
}
