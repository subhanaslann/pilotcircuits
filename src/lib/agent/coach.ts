import type { AgentSessionState } from "@/lib/agent/session";
import { toolAct } from "@/lib/agent/model";

/**
 * The coach's mood: what its face says about the call in flight.
 *
 * The ring on the bench (`mascot.ts`) shows *where* the agent is working, and
 * only for the four tools that name a place. This is the other half — *what*
 * it is doing — and it exists because a person who has never seen the product
 * cannot read a hollow ring as "the agent". A face can be read by anybody, and
 * a face that changes with the tool being called is the one thing on screen
 * that says, without a word, that the calls are real and are landing here.
 *
 * ## Ten moods, three sources
 *
 * Five are the acts in `model.ts`, one per verb. Two are the rest states —
 * `idle` with a host listening, `offline` without one. Three are **reactions**:
 * a verdict held for a moment after a call lands, read off the note the
 * runner logs beside it. `thinking` is the odd one: it is not an act of its own
 * but a *phase* of looking, and it is derived from the phase note the handler
 * raised (`comparingSketch`, `comparingExpected`, `checkingAlignment`) — the
 * moment the agent has read the bench and is weighing it against the sketch.
 *
 * That is the honest answer to "show the agent thinking". The page cannot see
 * the model think: between two calls there is no signal at all, and a face
 * that pretended otherwise would be claiming what it has not measured (the
 * screen appendix is clear: a badge that measures nothing is not a badge).
 * Inside a call the phases *are* measured, so the face follows them.
 *
 * Pure, and without React: the hook that owns the timer for reactions is
 * `components/agent/use-coach-mood.ts`. Everything here is a function of the
 * session state, which is what lets `coach.test.ts` walk every tool through
 * the table without a bench.
 */
export const coachMoods = [
  "offline",
  "idle",
  "looking",
  "thinking",
  "showing",
  "touching",
  "testing",
  "moving",
  "found",
  "passed",
  "failed",
] as const;

export type CoachMood = (typeof coachMoods)[number];

/** A verdict the face holds for a moment after the call that produced it. */
export type CoachReaction = Extract<CoachMood, "found" | "passed" | "failed">;

/** How long a reaction is held before the face goes back to rest. */
export const REACTION_MS = 1800;

/**
 * The least time any mood but rest stays on the face.
 *
 * A real host calls a tool and is answered in a few hundred milliseconds —
 * `get_build_context` is 420 ms end to end, and the phases inside
 * `inspect_build` are 380, 520 and 340. Shown as they happen, "Reading your
 * build" was on screen for less time than it takes to read it — a flicker,
 * not a sentence. So the face is a *presentation* of the session rather than a
 * mirror of it: whatever it shows, it shows for at least this long, and a
 * change that arrives sooner waits its turn. When the wait ends, the mood
 * shown is the **latest** one, not the next one — a queue would have the face
 * replaying a call that finished a second ago.
 *
 * Leaving rest is exempt: a call starting has to be seen starting, and the
 * only thing "Listening" was holding was the absence of a call.
 */
export const DWELL_MS = 1200;

/** The two moods that hold nothing and can be left at once. */
export function atRest(mood: CoachMood): boolean {
  return mood === "idle" || mood === "offline";
}

/**
 * How much longer the face shown since `since` has to stay before it may
 * change, at `now`. Zero when it is at rest or has had its time.
 */
export function dwellLeft(
  shown: { mood: CoachMood; since: number },
  now: number,
): number {
  if (atRest(shown.mood)) return 0;
  return Math.max(0, DWELL_MS - (now - shown.since));
}

/**
 * The phases during which a looking agent is weighing rather than reading.
 *
 * Keys of `copy.agentPanel.phases`, matched by key so the mood follows the
 * phase whatever language the sentence is in. Listed here and not marked in
 * the dictionary, because the dictionary is words and this is a claim about
 * what the handler is doing at that moment.
 */
const THINKING_PHASES: ReadonlySet<string> = new Set([
  "comparingSketch",
  "comparingExpected",
  "checkingAlignment",
]);

/**
 * The mood of the call in flight, or `null` when nothing is running.
 *
 * Read off the session, never off a button: a call that arrives through
 * WebMCP and one made from the panel are the same `running` entry, so the face
 * cannot be lively for one and blank for the other.
 */
export function runningMood(state: AgentSessionState): CoachMood | null {
  const call = state.running;
  if (!call) return null;

  const act = toolAct[call.name];
  if (act !== "looking") return act;

  const entry = state.activity.find((e) => e.call?.id === call.id);
  return entry?.phase && THINKING_PHASES.has(entry.phase.k)
    ? "thinking"
    : "looking";
}

/**
 * The face at rest. `offline` is the pulse's hollow ring said with a face:
 * absence drawn as absence, not a cheerful figure beside `Agent not connected`.
 */
export function restingMood(state: AgentSessionState): CoachMood {
  return state.webMcpAvailable ? "idle" : "offline";
}

/**
 * What the face does for a moment after the call `callId` landed.
 *
 * The runner closes a call's own entry and then logs the *note* — what it
 * found, with a tone — as a separate entry right after it, so the verdict is
 * read from the entries that follow the call's rather than from the call's
 * own row. A refused or crashed call is a `failed` face whatever it was doing;
 * a call that landed without a verdict (a context read, a lead seated) gets
 * no reaction at all, because a figure that cheered after every read would be
 * a figure nobody reads.
 */
export function reactionFor(
  state: AgentSessionState,
  callId: string,
): CoachReaction | null {
  const index = state.activity.findIndex((e) => e.call?.id === callId);
  if (index === -1) return null;

  const own = state.activity[index];
  if (own.status === "error") return "failed";

  for (const entry of state.activity.slice(index + 1)) {
    if (entry.call) break;
    if (entry.tone === "failed") return "failed";
    if (entry.tone === "passed") return "passed";
    if (entry.tone === "found") return "found";
  }
  return null;
}

/**
 * The one mood to draw, given a reaction the hook may be holding.
 *
 * A call in flight always wins — a face still smiling about the last verdict
 * while a new call runs would be describing the wrong call — then the held
 * reaction, then rest.
 */
export function coachMood(
  state: AgentSessionState,
  reaction: CoachReaction | null,
): CoachMood {
  return runningMood(state) ?? reaction ?? restingMood(state);
}
