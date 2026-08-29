import type { Copy } from "@/content/i18n";
import type { CoachingLevel } from "@/lib/agent/model";
import { stepWords, type StepId } from "@/lib/agent/steps";

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
  | { ref: "coaching"; level: CoachingLevel };

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
  return ref.ref === "step"
    ? stepWords(copy, ref.id).name
    : copy.agentPanel.coaching[ref.level];
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
