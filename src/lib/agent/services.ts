import type { Copy } from "@/content/i18n";
import { clockOf, summariseArgs, type ToolCall } from "@/lib/agent/activity";
import {
  deriveFindings,
  inspectionCovers,
  isResolved,
  verifyStep,
  type FindingId,
} from "@/lib/agent/findings";
import { say, type Line } from "@/lib/agent/line";
import {
  coachingOrder,
  inspectionScopes,
  isCoachingLevel,
  isInspectionScope,
  type AgentTool,
  type CoachingLevel,
  type InspectionScope,
} from "@/lib/agent/model";
import type { AgentSessionState, SessionPatch } from "@/lib/agent/session";
import {
  nextStep,
  stepById,
  stepWords,
  stepsOwning,
  type StepId,
} from "@/lib/agent/steps";
import { isServoAligned, maybeNode, type NodeId } from "@/lib/circuit/graph";
import { buildFor } from "@/lib/agent/builds";
import { projectById } from "@/lib/projects/catalog";
import { placeIn } from "@/lib/agent/placement";
import { GRIP_AT, SEAT_AT } from "@/lib/agent/mascot";
import {
  attachmentOf,
  inbound,
  isHole,
  partOf,
  partsInKit,
  type TerminalId,
} from "@/lib/circuit/placement";
import type { ProjectFilters } from "@/lib/projects/filter";

/**
 * Batch 4 · The workbench tools — seven of them since `attach_lead`.
 *
 * Each one is a plain async function of `(input, context)`. It reads the
 * session, waits out its own named phases, and returns three things: the
 * payload a caller gets back, the patch that lands in one commit, and the
 * effects that happen outside React state.
 *
 * Effects are **data, not calls**. A handler that reached for a canvas ref
 * would have to be a closure over React internals — untestable, and
 * un-callable from the WebMCP callback the browser invokes in Batch 7. As data,
 * the handler stays pure and the applier is one switch statement.
 *
 * The latency is real and deliberate. It is not animation, and reduced motion
 * must not remove it: a tool that lands instantly gives the user nothing to
 * read, and rule 6 says a change nobody sees did not happen.
 */

export type ToastTone = "info" | "success" | "warning" | "error";

/**
 * One line of `run_functional_test`'s report.
 *
 * `detail` is what the board measured — `18 cm`, `0° → 90°` — so it is never
 * translated (rule 13). It is also only shown on a check that passed: in
 * `StepLoader` a detail takes the place of the state word, and a failed row
 * has to keep saying `Failed` (rule 9).
 */
export interface TestCheck {
  /**
   * Which check this is — a `CheckSpec.id` from the build's own run.
   *
   * A string rather than the capstone's three, because the set is per build:
   * chapter one checks its wiring and whether the lamp can breathe, and it has
   * neither a sensor nor a servo to report on.
   *
   * Named `check`, not `subject`. `subject` already means three other things in
   * this layer — a finding's silkscreen glyph, its lead id, and the printed pin
   * name — and this is none of them: it is the id the `test` argument takes,
   * and `run_functional_test({test: results[0].check})` is a legal call.
   */
  check: string;
  passed: boolean;
  detail: string;
}

export type SessionEffect =
  | { kind: "focus"; nodes: NodeId[]; padding: number; scale?: number }
  | { kind: "fitView" }
  /** C-22 · run the green pulse along these connections. */
  | { kind: "trace"; connectionIds: string[] }
  /**
   * C-23 · D-01…D-06 · play the functional test.
   *
   * One effect, two readings: the canvas draws the run as theatre and the dock
   * prints it as numbers. It carries the per-check results because the dock
   * has to show *which* check failed while the sequence is still playing —
   * waiting for the tool's return value would put the rows a beat behind the
   * car.
   *
   * Emitted whether the test passes or fails. It used to fire only on success,
   * which left the product's default scenario — a servo horn a quarter turn
   * out — with nothing on the canvas and nothing in the dock. Rule 6: a change
   * nobody sees did not happen.
   */
  | {
      kind: "runTest";
      results: TestCheck[];
      /** Every row this build's run has, in order — including any not asked for. */
      checks: string[];
    }
  /**
   * Batch 8 · move the person to another route.
   *
   * The library's `open_project` and `start_project` change which screen you
   * are looking at, and a handler that reached for `useRouter` would be a
   * handler that could only ever run inside a component — the one thing this
   * file has avoided since Batch 4. So navigation is data too, and the applier
   * is one more case in the same switch.
   */
  | { kind: "navigate"; href: string }
  /**
   * Batch 8 · narrow the library, visibly.
   *
   * `find_projects` could answer from `filterProjects()` without touching the
   * screen, and the person would then watch an agent claim to have searched
   * while the toolbar sat unchanged. Rule 6: a change nobody sees did not
   * happen. The tool moves the same control the user moves.
   */
  | { kind: "filters"; next: ProjectFilters }
  | { kind: "toast"; tone: ToastTone; message: string };

export interface ToolContext {
  /** Live read — a handler never holds its own copy of the state. */
  read: () => AgentSessionState;
  /** The reader's dictionary. Every sentence a tool produces comes from it. */
  copy: Copy;
  /**
   * Batch 8 · the reader's locale.
   *
   * Needed by exactly one caller — the library search folds case with it, and
   * `İstasyon` folds differently under Turkish rules than invariant ones. It is
   * on the shared context rather than a second argument because a handler
   * should not have to know whether it is the one that cares.
   */
  locale: string;
  /** Announces a phase and waits it out. The simulated latency lives here. */
  phase: (note: Line, ms: number) => Promise<void>;
}

export interface ToolOutcome {
  status: "ok" | "error";
  /** Serialisable: what a caller gets, and what `Raw result` renders. */
  result?: unknown;
  errorMessage?: Line;
  /** Everything the call changed, committed with its activity entry. */
  patch?: SessionPatch;
  /**
   * Whether the patch is a **gesture on the bench** rather than a reading.
   *
   * Set, the runner lands it through `commit` instead of folding it into the
   * entry — which is what puts it on the undo stack. The person has to be able
   * to take back something an agent did to their build with the same keypress
   * they take back their own mistakes; an agent's write that cannot be undone
   * is a worse affordance than no write at all.
   */
  commits?: boolean;
  /** A sub-line under the call: what it did. */
  outcome?: Line;
  /** A separate entry: what it found. An outcome is not a call of its own. */
  note?: { headline: Line; tone?: "found" | "passed" | "failed" };
  effects?: SessionEffect[];
}

export interface ToolInputs {
  get_build_context: Record<string, never>;
  inspect_build: { scope?: InspectionScope };
  show_correction: { finding_id: FindingId; detail_level?: CoachingLevel };
  attach_lead: { lead: TerminalId; target?: NodeId | null };
  verify_current_step: Record<string, never>;
  navigate_build_step: { step_id: StepId };
  run_functional_test: { test: string };
}

/* --- Timing --------------------------------------------------------------
   Deterministic, never random: the demo has to be repeatable to be filmed.
   No phase runs long enough for the panel to look stuck.                    */

/* --- Projections ---------------------------------------------------------
   `get_build_context` answers from the same graph the canvas draws from.
   In the reader's language: an agent asked to explain the build to the person
   in front of it should be handed the same words they can see.              */

function summarise(state: AgentSessionState, copy: Copy, locale: string) {
  const step = stepById(state.activeStepId);
  const words = stepWords(copy, step.id);
  return {
    /**
     * The build on the bench, not `copy.build.project`.
     *
     * That key is a single string — the capstone's name — so an agent standing
     * at chapter one was told it was looking at the Smart Parking Barrier while
     * every connection it read belonged to a breathing lamp. A per-build fact
     * in a global place, the same mistake this file has now made three times;
     * the catalogue names every chapter and is the only thing that should.
     *
     * **All three names, in one object.** `project` used to be the display name
     * alone, while the same word is the id-or-slug *argument* of four library
     * tools — so a model that carried this result across a navigation fed
     * `"Traffic Light"` into `open_project` and was refused, six times out of
     * six. It is the triple `describe()` already ships, so the two read tools
     * now speak one shape, and every one of the three is something a caller can
     * use: `id` and `slug` are both accepted by those four tools, and `name` is
     * the only one a person recognises.
     *
     * `projectId` is gone from beside it, not kept as well: it was `project.id`
     * under another name, and a fact with two copies is a fact that can drift.
     */
    project: {
      id: state.projectId,
      slug: projectById(state.projectId).slug,
      name: copy.projects[state.projectId].name,
    },
    /**
     * Which language everything above is in.
     *
     * Every translated field already answers it — a Turkish session hands back
     * a Turkish `name` and a Turkish `instruction` — so nothing here was
     * unknowable. What was missing is a field a client can *branch* on without
     * guessing a language from a proper noun. One line, and it is the only tool
     * that reports it because it is the only one whose whole job is context.
     */
    locale,
    /**
     * How many gestures on this bench the agent made.
     *
     * Reported so that an agent asked to help can tell the difference between a
     * build somebody is making and one it made itself — and so that nothing
     * downstream has to infer it. See `AgentSessionState.assistedEdits`.
     */
    assistedEdits: state.assistedEdits,
    activeStep: {
      id: step.id,
      index: step.index,
      name: words.name,
      instruction: words.instruction,
    },
    expectedConnections: state.scene.expected.map(
      (c) => `${c.from} -> ${c.to}`,
    ),
    observedConnections: state.scene.observed.map(
      (c) => `${c.from} -> ${c.to}`,
    ),
    mechanical: {
      servoAngle: state.scene.mechanical.servoAngle,
      expectedAngle: state.scene.mechanical.expectedAngle,
      aligned: isServoAligned(state.scene),
    },
    openFindings: state.findings.filter((f) => !isResolved(f, state.scene))
      .length,
    /**
     * Where the parts are, on a build the person assembles.
     *
     * The gap this closes was the loudest one in the whole surface: an agent
     * standing at chapter one's empty bench could read every expected and
     * observed connection and still had no way to learn that the LED was in
     * the box — `observed` is empty either way, and a part with no leads on
     * the bench has no nodes to appear in it. It could describe a build it
     * could not see.
     *
     * `null` on a build laid out by the author, which is the honest answer:
     * there is no kit and nothing to place, and an empty object here would
     * read as a bench with everything still in it.
     */
    placement: placementOf(state),
    /* Never hidden. The interface does not pretend to be real hardware. */
    source: "demo",
  };
}

/** What `attach_lead` may be asked for, in the names it must be asked in. */
function placementOf(state: AgentSessionState) {
  const spec = buildFor(state.projectId)?.placement;
  if (!spec) return null;

  const inKit = partsInKit(spec, state.placement);
  return {
    parts: spec.parts.map((part) => ({
      id: part,
      component: spec.componentOf[part],
      onBench: !inKit.includes(part),
      /**
       * The part's own leads — the mapping that did not exist anywhere.
       *
       * `parts[].id` and `attach_lead.lead` are two vocabularies with no
       * published bridge between them, and the one an agent would invent —
       * lower the camelCase id and add a dot — is wrong on two of the five
       * chapters, silently: chapter one's `resistor` is `res.in` / `res.out`,
       * and `plantGuardian`'s `probe` is `soil.vcc` / `soil.aout` /
       * `soil.gnd`. So a caller holding a `part-not-placed` finding's `part`
       * had a name it could do nothing with. Here it is, from the spec's own
       * table, in priority order — the first one is the lead that anchors the
       * part when it is seated.
       */
      leads: spec.terminalsOf[part] ?? [],
    })),
    /* Every lead and what it is holding on to — a hole, another lead, or
       nothing. This is the map `attach_lead` is read against. */
    leads: Object.fromEntries(
      spec.terminals.map((id) => [id, state.placement[id] ?? null]),
    ),
    /* `holes` used to be here: every hole on the board, re-sent on every call,
       55-56% of this result's bytes on chapters three to five and identical on
       every one of them. It is board geometry, not build state — and every id
       in it is already in `attach_lead`'s published `target` enum, which the
       host holds for the life of the registration. Paid once there instead of
       once per call. **The enum is not to be shrunk to match**: it is what lets
       a model name a hole it has not been handed, including a wrong one, and
       the refusals are only useful because it can. */
  };
}

/**
 * An argument this tool cannot honour, refused where the caller can read it.
 *
 * §9's rule 3 asks a tool for *success or a comprehensible error*, and five of
 * these calls used to answer a nonsense argument with success: a step id from
 * another chapter moved the bench onto it, a scope that is not a scope was
 * echoed back as if honoured, a detail level outside the ladder was written
 * into session state and closed all three rungs of the teaching panel, a
 * finding id nothing ever minted was told the finding had expired, and a
 * malformed filter was written into the library toolbar the person is looking
 * at.
 *
 * Two halves, and both are needed. The **sentence** is what the person watching
 * reads in the error toast, so it names the thing that was wrong rather than
 * saying a call failed. The **structure** is what the caller can act on — which
 * argument was refused, what arrived, and what would have been accepted — and it
 * goes in `result`, because a rendered sentence cannot carry a list of step ids
 * an agent is supposed to choose from.
 *
 * `refused` is the key, so `result.refused` and the dictionary line can never
 * drift apart: one object decides both.
 */
export function refused(
  message: Line,
  detail: Record<string, unknown>,
): ToolOutcome {
  return {
    status: "error",
    result: { refused: message.k, ...detail, source: "demo" },
    errorMessage: message,
  };
}

/**
 * A verification that also matched what it says it looked for.
 *
 * `verifyStep` computes `verified` from mismatches, strays and the horn, and
 * takes `expected` from a different source — the step's own connection count —
 * with no clause tying the two together. `diff` filters `scene.expected` down to
 * the step's ids, so a step whose ids the scene has never heard of yields zero
 * mismatches: `verified: true` sitting beside `matched: 0, expected: 6`, a
 * record contradicting itself in two adjacent fields. `verify_current_step`
 * trusted the boolean, ticked the step, advanced, and on the last one stamped
 * `completedAt` — six calls turning an untouched bench into a finished build
 * with `Finish` in the foot. `registry.test.ts` names this failure mode in prose
 * and nothing anywhere asserted against it.
 *
 * No-op on every real step of all six builds (`matched === expected` there by
 * construction, and the test below pins it), and false for every step the scene
 * cannot answer for. The clause belongs in `verifyStep` itself; this batch does
 * not own `findings.ts`, so it is enforced here, where the claim is made.
 */
function fullyVerified(report: ReturnType<typeof verifyStep>): boolean {
  return report.verified && report.matched === report.expected;
}

/**
 * What was found, named honestly: a servo a quarter turn out is not a wire, and
 * a join the sketch never named is not a mismatch either — calling it one sends
 * the person looking for the line about it that the sketch does not have. Only
 * a set that is all of one kind gets that kind's sentence; anything mixed falls
 * back to the count of issues, which is true of every set.
 */
function foundLine(found: { type: string }[]): Line {
  const all = (type: string) => found.every((f) => f.type === type);
  /* A part still in the box is not a connection in the wrong hole either, and
     it was being counted as one: an empty bench reported `1 connection
     mismatch found` over a finding whose own sentence says the LED has not
     been placed. Wiring is what is left once the two named kinds are out —
     and a **stray** is out too, for the reason the paragraph above gives and
     `extrasFound` repeats in the dictionary. This arm read "not mechanical and
     not part-not-placed", which let one missing join plus one join nobody asked
     for be announced as `2 connection mismatches found`: the ordinary outcome
     of moving a single lead to the wrong hole, described as two wires in the
     wrong place. A mixed set falls through to `issuesFound`, which is true of
     every set. */
  const allWiring = found.every(
    (f) =>
      f.type === "connection-mismatch" || f.type === "missing-connection",
  );
  return {
    ns: "activity",
    k: all("unexpected-connection")
      ? "extrasFound"
      : all("part-not-placed")
        ? "partsMissing"
        : allWiring
          ? "mismatchFound"
          : "issuesFound",
    args: [found.length],
  };
}

/* --- The handlers -------------------------------------------------------- */

/**
 * Annotated rather than `satisfies`: the annotation widens every return to
 * `ToolOutcome`, so the runner can read `patch`, `note` and `effects` off any
 * handler without narrowing per tool.
 */
type ToolHandlers = {
  [K in keyof ToolInputs]: (
    input: ToolInputs[K],
    ctx: ToolContext,
  ) => Promise<ToolOutcome>;
};

export const handlers: ToolHandlers = {
  async get_build_context(_input, ctx) {
    await ctx.phase({ ns: "phases", k: "readingContext" }, 420);
    return { status: "ok", result: summarise(ctx.read(), ctx.copy, ctx.locale) };
  },

  async inspect_build(input, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const step = stepById(state.activeStepId);

    /**
     * The argument, checked before anything reads it.
     *
     * `"everything"`, `null` and `42` all fell through `scopeConnections` and
     * `scopeKinds` to their `default` arms — the whole build, every kind — and
     * came back as `status: "ok"` with the junk echoed in `result.scope`. On the
     * capstone that silently *deleted* the servo finding: an unrecognised scope
     * is admitted by `inspectionCovers`, so the finding is dropped from what the
     * inspection keeps, and refused by `scopeChecksMechanical`, so it is never
     * re-derived. An agent holding that id had it stop resolving with nothing
     * anywhere saying so.
     *
     * Against the five names, not against `schemaFactsFor(...).scopes`. A build
     * that does not offer `mechanical` still answers truthfully when asked —
     * there is nothing mechanical here, so there is nothing to correct — and
     * §9 asks for a true answer, not a refusal. A name that is not one of the
     * five is a different thing: it is a caller that has misunderstood the tool.
     */
    const asked: unknown = input.scope;
    if (asked !== undefined && !isInspectionScope(asked)) {
      return refused(
        {
          ns: "errors",
          k: "unknownScope",
          args: [[...inspectionScopes].join(", ")],
        },
        { argument: "scope", value: asked ?? null, valid: [...inspectionScopes] },
      );
    }
    const scope: InspectionScope = asked ?? "current_step";

    await ctx.phase({ ns: "phases", k: "readingWiring" }, 380);
    await ctx.phase({ ns: "phases", k: "comparingSketch" }, 520);
    if (scope === "mechanical" || scope === "all" || step.checksMechanical) {
      await ctx.phase({ ns: "phases", k: "checkingAlignment" }, 340);
    }

    const found = deriveFindings(
      state.scene,
      scope,
      state.activeStepId,
      Date.now(),
    );

    /* What this inspection did not look at, and which is still true. An id an
       agent is holding stays valid for as long as the thing it names is. */
    const kept = state.findings.filter(
      (finding) =>
        !isResolved(finding, state.scene) &&
        !inspectionCovers(finding, scope, state.activeStepId) &&
        !found.some((fresh) => fresh.id === finding.id),
    );

    /* Which part a lead belongs to, for the answer below. */
    const spec = buildFor(state.projectId)?.placement;

    return {
      status: "ok",
      result: {
        scope,
        /**
         * Structure, not sentences: what a caller — and the WebMCP consumer —
         * needs is the finding's type and the pins it names, not a rendering of
         * them in whichever language the panel happens to be showing. `Raw
         * result` prints exactly what the tool returned.
         *
         * **Two vocabularies, in pairs.** `subject` / `expected` / `observed`
         * are what the hardware *prints* — `−`, `220Ω`, `F7`, `D6` — which is
         * what a person reading over the agent's shoulder can find on the board.
         * `subjectLead` / `expectedNode` / `observedNode` are the graph ids of
         * those same three things, which is what `attach_lead` takes. Both are
         * needed and neither substitutes for the other.
         *
         * The ids were on the `Finding` the whole time and were dropped here, so
         * a wiring finding named a silkscreen glyph and nothing else: a caller
         * holding one could say what was wrong and had no argument with which to
         * put it right. The only route to the write ran through
         * `show_correction` — a tool that moves the camera and raises a toast —
         * for values this projection was already holding. It is one hop now:
         * `attach_lead(subjectLead, expectedNode)`.
         *
         * The mechanical arm has neither pair, deliberately. A servo a quarter
         * turn out is not fixed by moving a lead, and publishing `servo.signal`
         * as a `subjectLead` would invite exactly that call.
         */
        findings: found.map((f) => ({
          id: f.id,
          type: f.type,
          severity: f.severity,
          ...(f.type === "mechanical-alignment"
            ? { expected: f.expectedAngle, observed: f.observedAngle }
            : f.type === "unexpected-connection"
              ? /* `expected: null` rather than an omitted key: a caller reading
                   the arms wants the same field names, and a stray's answer to
                   "where does it belong" is that there is nowhere. The fix for
                   one is the other call `attach_lead` makes —
                   `attach_lead(subjectLead, null)` takes the join back out.
                   `subjectLead` before the affected node because it is the
                   declared field; it is only set where the part prints nothing
                   beside the lead, and the first affected node is the same end
                   either way (`extraFinding`, `findings.ts`). */
                {
                  subject: f.subject,
                  subjectLead: f.subjectLead ?? f.affectedNodes[0]?.id ?? null,
                  expected: null,
                  expectedNode: null,
                  observed: f.otherTerminal,
                  observedNode: f.otherLead ?? f.affectedNodes[1]?.id ?? null,
                }
              : f.type === "part-not-placed"
                ? /* The lead the step names, and the part it belongs to in the
                     spec's own id — the same `id` `get_build_context` lists
                     under `placement.parts`. It is **not** a name `attach_lead`
                     takes: measured, `attach_lead({lead: part})` is refused on
                     all 33 of these findings across the five assembled chapters,
                     and `part` is in the `target` enum on none of them either.
                     The name `attach_lead` takes is `subject` — repeated as
                     `subjectLead`, because one field name that always holds a
                     lead is the point of the pairing above.
                     `part` was `f.component`, which is the COUNTED kind:
                     `componentOf` collapses every `led.*` to `led`, every
                     `res.*` to `resistor` and every `wire.*` to `jumper`, so
                     chapter two answered ten findings with three names and the
                     two read tools described the same parts in two different
                     vocabularies. The finding's own sentence still says what is
                     printed on the part in your hand; this is what the tool
                     returns to a caller that cannot see the bench.

                     `expected` was the sentinel `"on-bench"` and `observed` the
                     sentinel `"in-kit"` — two invented English tokens in fields
                     that carry silkscreen everywhere else, and neither of them
                     an answer to *where does this part go*. The seat was on the
                     finding all along: `highlight.targetPin` is the hole the
                     target ring is drawn on, and the first affected node is that
                     same hole with its printed label already read off the scene.
                     `observed` is empty because the part is nowhere on the
                     board, and the type is what says it is in the kit. */
                  {
                    subject: f.terminal,
                    subjectLead: f.terminal,
                    part: (spec && partOf(spec, f.terminal)) ?? null,
                    expected: f.affectedNodes[0]?.terminal ?? null,
                    expectedNode: f.highlight.targetPin ?? null,
                    observed: null,
                    observedNode: null,
                  }
                : /* The wiring pair. `target` is where the sketch wants this
                     lead — the exact value `attach_lead` takes as its `target` —
                     and `highlight.errorPin` is the hole it is in instead,
                     absent on a `missing-connection` because it is in nothing.
                     Both were dropped while `expectedTerminal` and
                     `observedTerminal`, the printed labels of those same two
                     holes, went out alone. */
                  {
                    subject: f.subject,
                    subjectLead:
                      f.subjectLead ?? f.affectedNodes[0]?.id ?? null,
                    expected: f.expectedTerminal,
                    expectedNode: f.target,
                    observed: f.observedTerminal ?? null,
                    observedNode: f.highlight.errorPin ?? null,
                  }),
          confidence: f.evidence.confidence,
        })),
        source: "demo",
      },
      patch: {
        findings: [...kept, ...found],
        /**
         * The credit list belongs to the findings list — **scoped the same way
         * the list is.**
         *
         * It was emptied outright, on the reasoning that freshly derived
         * findings have not been paid for. But the same patch keeps
         * out-of-scope findings alive through `kept`, so after a narrow
         * inspection the two lists disagreed: findings that had already been
         * counted survived and their credit did not. `commit` in
         * `agent/placement.ts` guards double-billing with exactly this set
         * (`const credited = new Set(state.repaired)`), so the sequence
         * inspect → build → knock a lead loose → inspect → put it back credited
         * one original fault twice, and `/complete` reported more issues fixed
         * than the build ever had.
         *
         * Keep the credit of every finding that survived, drop the rest. A
         * finding genuinely re-derived from scratch loses its credit, which is
         * right: it is open again.
         */
        repaired: state.repaired.filter(
          (id) =>
            kept.some((f) => f.id === id) || found.some((f) => f.id === id),
        ),
        /* Looking is the fact, not finding. A step inspected and clean has to
           be able to move on. */
        inspectedStepId: state.activeStepId,
        tab: found.length ? ("findings" as const) : state.tab,
      },
      note: found.length
        ? { headline: foundLine(found), tone: "found" as const }
        : {
            /* The clean sentence has to be about what was looked at. One
               sentence said "in this step" whatever the scope was, so a
               whole-build inspection that came back clean reported on a
               narrower thing than it had read — and on chapters 1-5 that is
               the line a `wiring` scope prints while the entire build is still
               in the box. `current_step` is the only scope that is about a
               step; the other four read the build. */
            headline: {
              ns: "activity" as const,
              k:
                scope === "current_step"
                  ? ("nothingFound" as const)
                  : ("nothingFoundInBuild" as const),
            },
          },
      /* A toast is read once and gone, so it is words, not a `Line`. */
      effects: found.length
        ? [
            {
              kind: "toast" as const,
              tone: "warning" as const,
              message: say(copy, foundLine(found)),
            },
          ]
        : [],
    };
  },

  async show_correction({ finding_id, detail_level }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;

    /**
     * The level, checked against the ladder it is written into.
     *
     * This value went straight into `state.coaching`, unchecked. Anything
     * outside the union then poisoned the panel rather than the call: the
     * segmented control has no option to select, `coachingOrder.indexOf(level)`
     * is `-1` so every rung renders closed — including `hint`, which is always
     * meant to be open — and the ladder's one control offers to move the reader
     * *down* to hint. A correction card with no sentence in it, reported as a
     * success, and only a level change or a reset gets out of it.
     */
    const askedLevel: unknown = detail_level;
    if (askedLevel !== undefined && !isCoachingLevel(askedLevel)) {
      return refused(
        {
          ns: "errors",
          k: "unknownDetailLevel",
          args: [[...coachingOrder].join(", ")],
        },
        {
          argument: "detail_level",
          value: askedLevel ?? null,
          valid: [...coachingOrder],
        },
      );
    }
    const level: CoachingLevel = askedLevel ?? state.coaching;

    /**
     * Two conditions, two answers. They were the wrong way round.
     *
     * An id nothing ever minted was refused with *"That finding is no longer
     * open"* — which tells an agent its id has expired and invites it to
     * re-inspect, when the cause is a typo or another build's id. Meanwhile the
     * id of a finding the person had already put right returned `status: "ok"`,
     * opened the findings tab and swung both cameras onto the now-correct hole.
     * The product owned the right sentence and had attached it to the one case
     * it does not describe, with no branch at all for the case it names. There
     * are two sentences now and the pair is the point: `noSuchFinding` says
     * nothing ever carried that id, `unknownFinding` says an id the panel really
     * minted has since been put right.
     */
    const finding = state.findings.find((f) => f.id === finding_id);
    if (!finding) {
      return refused(
        { ns: "errors", k: "noSuchFinding" },
        {
          argument: "finding_id",
          value: finding_id ?? null,
          /**
           * Two lists, because they are two facts, and one shared key so a
           * client does not have to know which refusal it is reading.
           *
           * `valid` means the same thing on all four `refused()` paths — what
           * this argument accepts — and here that is every id the panel has
           * minted and still holds, resolved ones included: a resolved id IS
           * recognised, and is answered with `unknownFinding` rather than this.
           * `open` is the strict subset that would succeed right now. Naming
           * the subset `valid` instead, which is the tidy-looking fix, would
           * assert that a resolved id is not a valid `finding_id` — and the
           * branch directly below is the proof that it is.
           *
           * The sentence sends the caller back to `inspect_build`; a rendered
           * sentence cannot carry a list, so both lists go here.
           */
          valid: state.findings.map((f) => f.id),
          open: state.findings
            .filter((f) => !isResolved(f, state.scene))
            .map((f) => f.id),
        },
      );
    }
    if (isResolved(finding, state.scene)) {
      /* Through `refused()` like every other refusal in the layer. This was the
         one error whose body was success-shaped — four keys, an `error` beside
         them and no `refused` at all — so a client branching on
         `"refused" in body` read it as a success. The echo survives unchanged:
         the level the caller asked for, returned with the answer, because an
         agent that asked for `exact` on a fault that is already fixed has
         learned something about the build and the reply says which question it
         is the answer to. */
      return refused(
        { ns: "errors", k: "unknownFinding" },
        { findingId: finding.id, detailLevel: level, resolved: true },
      );
    }

    await ctx.phase({ ns: "phases", k: "locating" }, 260);

    const alreadyShown =
      state.highlightedFindingId === finding_id && state.coaching === level;

    return {
      status: "ok",
      result: {
        findingId: finding.id,
        detailLevel: level,
        focused: finding.focus.nodes,
        /**
         * Whether this call moved anything, said out loud.
         *
         * The handler has always known — `alreadyShown` is right here and the
         * timeline prints two different sentences off it — and the caller was
         * the one reader never told: two `show_correction` calls with the same
         * arguments returned byte-identical bodies. The layer had three
         * different answers to *nothing happened* — a refusal, a key that goes
         * missing, and silence — and this makes one of them explicit.
         *
         * Not the same claim as "the screen did not move": the patch lands
         * either way, so a person who had switched to another tab is brought
         * back by the second call too. This is about the highlight.
         */
        changed: !alreadyShown,
        source: "demo",
      },
      patch: {
        highlightedFindingId: finding.id,
        coaching: level,
        tab: "findings" as const,
      },
      outcome: {
        ns: "activity" as const,
        k: alreadyShown
          ? ("correctionAlreadyShown" as const)
          : ("correctionHighlighted" as const),
      },
      effects: [
        {
          kind: "focus" as const,
          nodes: finding.focus.nodes,
          padding: finding.focus.padding,
          scale: finding.focus.scale,
        },
        {
          kind: "toast" as const,
          tone: "info" as const,
          message: copy.workbench.correctionHighlighted,
        },
      ],
    };
  },

  /**
   * Batch 9 · The one call that moves the build.
   *
   * It is `placeIn` — the same pure function the person's own release goes
   * through — so an agent's write and a learner's write cannot diverge: the
   * same refusals, the same consequences, the same pruning of joins that lost
   * their hold. What differs is only who is announced as having done it.
   *
   * ## Why it waits
   *
   * The two phases are not decoration and they are not padding: they are
   * exactly as long as it takes the ring to reach the lead and carry it across
   * (`lib/agent/mascot.ts`). The commit lands on the frame the ring arrives, so
   * a person watching sees the part move under the thing that moved it. Take
   * the wait out and the build changes half a second before its cause appears.
   *
   * ## Read fresh, twice
   *
   * The state read at the top is a second old by the time the write happens and
   * nothing disables the bench while a tool runs. The person may have picked
   * that very lead up meanwhile — so the placement is asked again against the
   * state it is about to patch, and a refusal is a sentence rather than a
   * silence.
   */
  async attach_lead({ lead, target = null }, ctx) {
    const state = ctx.read();
    const spec = buildFor(state.projectId)?.placement;

    if (!spec) {
      /* Not an argument error — `lead` may be perfectly well formed and there
         is still nothing here to write. Chapter six is laid out by its author:
         no kit, nothing to place, and every call refuses. `reason` is what says
         so, so an agent learns on call #1 rather than call #12 that this bench
         takes no writes. */
      return refused(
        { ns: "errors", k: "noPlacement" },
        { argument: "lead", value: lead ?? null, reason: "authorPlaced" },
      );
    }
    if (!spec.terminals.includes(lead)) {
      /* The whole domain, because it fits: a build's leads are the ends of the
         parts in its kit — four on chapter one, twenty at the widest — and a
         caller that misspelt one can read the right spelling straight out of
         the refusal. An ABSENT `lead` and a misspelt one used to be
         byte-identical; `value: null` is what tells them apart. The schema
         marks the argument `required`, for the hosts that enforce it. */
      return refused(
        { ns: "errors", k: "unknownLead" },
        { argument: "lead", value: lead ?? null, valid: [...spec.terminals] },
      );
    }
    if (
      target !== null &&
      !isHole(spec, target) &&
      !spec.terminals.includes(target)
    ) {
      /* The one refusal a sentence genuinely cannot carry. The set this is
         answered out of is every hole plus every lead plus `null` — the
         published `target` enum, 398, 404 and 400 entries on chapters three to
         five — so listing it here would spend more on one mistake than the
         registration spends on the tool. A sample of each family and the count
         instead: the sample shows the two address schemes (`bb.f7`, a
         breadboard hole; `led.cathode`, a part's lead) and `count` says how
         large the set it came from is. `count` is the named ids; `null` is
         legal too and takes the lead back out, which is what the enum's extra
         entry is. */
      return refused(
        { ns: "errors", k: "unknownTarget" },
        {
          argument: "target",
          value: target,
          validSample: [
            ...spec.holes.slice(0, 6),
            ...spec.terminals.slice(0, 6),
          ],
          count: spec.holes.length + spec.terminals.length,
        },
      );
    }

    await ctx.phase({ ns: "phases", k: "reaching" }, GRIP_AT);
    await ctx.phase({ ns: "phases", k: "carrying" }, SEAT_AT - GRIP_AT);

    const live = ctx.read();
    const outcome = placeIn(live, spec, lead, target);

    if (!outcome.changed) {
      /**
       * The five ways the bench says no, and not one of them is an argument
       * error: `lead` and `target` both named something real and the model is
       * what refused. So the payload is not `{argument, value, valid}` — it is
       * the gesture and the thing standing in its way.
       *
       * `occupant` is the one fact the sentences could not carry and the one a
       * caller needs to get past the refusal: `holeTaken` names the hole and not
       * the lead sitting in it, and `leadNotFree` names neither. With it,
       * `attach_lead(occupant, null)` is the call that clears the way. Always a
       * node id, and `null` where nothing is in the way at all — a part cannot
       * meet its own other end (`sameCircuitPart`), a jumper only ever lives in
       * a hole (`wireEnd`), and `leadAlreadyThere` is the seat already holding
       * the very lead that asked for it.
       */
      const occupant =
        target === null
          ? null
          : outcome.refusal === "holeTaken"
            ? /* Whose lead is in that hole, ignoring this one — the same test
                 `tryAttach` refused on. */
              (inbound(spec, live.placement, target).find((u) => u !== lead) ??
              null)
            : outcome.refusal === "leadNotFree"
              ? /* What the target lead is engaged with, whichever side stored
                   the edge: the hole it sits in, or the lead clipped onto it.
                   `attach_lead(target, null)` frees it either way. */
                (attachmentOf(spec, live.placement, target) ?? null)
              : null;

      return refused(
        outcome.refusal === "holeTaken"
          ? {
              ns: "errors" as const,
              k: "holeTaken" as const,
              args: [
                (target ? maybeNode(live.scene, target)?.label : undefined) ??
                  target ??
                  "",
              ] as [string],
            }
          : outcome.refusal === "leadNotFree"
            ? { ns: "errors" as const, k: "leadNotFree" as const }
            : outcome.refusal === "sameCircuitPart"
              ? { ns: "errors" as const, k: "sameCircuitPart" as const }
              : /* A cable end asked to clip onto a leg. It gets its own rung
                   rather than sharing `sameCircuitPart`, because the two
                   refusals teach opposite things: that one says a part cannot
                   meet itself, this one says a jumper only ever lives in a hole
                   — and an agent told the wrong one will retry the same gesture
                   with a different part and be refused again. A rung missed
                   here is not a compile error either: every arm below falls
                   through to `leadAlreadyThere`, which is the one sentence in
                   this ladder that claims the write succeeded. */
                outcome.refusal === "wireEnd"
                  ? { ns: "errors" as const, k: "wireEnd" as const }
                  : /* Changed nothing and refused nothing: the lead is already
                       exactly where it was asked to go. Not a failure, but not
                       a write either, and the caller has to be able to tell. */
                    { ns: "errors" as const, k: "leadAlreadyThere" as const },
        { lead, target, occupant },
      );
    }

    const { effects } = outcome;

    return {
      status: "ok",
      result: {
        lead,
        target,
        /**
         * Where the lead was before this call, so the move can be taken back.
         *
         * `attach_lead(lead, from)` is the exact inverse of any single call —
         * the one thing the result could not say, on a tool whose own comment
         * below is *"what a caller needs back is what the model did"*. Where it
         * came from is half of what it did. `undo` and `redo` are reducer
         * actions with no tool behind them, so this is the only inverse an
         * agent has.
         *
         * Read from `live`, the state `placeIn` was asked against, and read
         * before the patch lands — `state` is a second old by here and the
         * person may have moved that very lead meanwhile.
         *
         * The edge stored **on** this lead, which is where a join is stored: a
         * join another lead had made *onto* this one is knocked loose by the
         * move and is reported in `brokeJoins`, not here. So `from` inverts the
         * hop and `brokeJoins` names what the hop cost.
         */
        from: live.placement[lead] ?? null,
        /* Structure, not sentences — the same rule `inspect_build` follows.
           What a caller needs back is what the model did, in its own names. */
        seated: effects.seated?.hole ?? null,
        joinedTo: effects.joined?.lead ?? null,
        loosened: effects.loosened ?? null,
        brokeJoins: effects.brokeJoins.map((join) => join.from),
        leftBench: effects.leftBench,
        enteredBench: effects.enteredBench,
        source: "demo",
      },
      patch: outcome.patch,
      commits: true,
      outcome: effects.seated
        ? {
            ns: "activity" as const,
            k: "leadSeated" as const,
            args: [
              {
                ref: "lead" as const,
                id: effects.seated.terminal,
                case: "acc" as const,
              },
              maybeNode(outcome.patch.scene ?? live.scene, effects.seated.hole)
                ?.label ?? effects.seated.hole,
            ] as [{ ref: "lead"; id: TerminalId; case: "acc" }, string],
          }
        : effects.joined
          ? {
              ns: "activity" as const,
              k: "leadJoined" as const,
              args: [
                {
                  ref: "lead" as const,
                  id: effects.joined.terminal,
                  case: "acc" as const,
                },
                {
                  ref: "lead" as const,
                  id: effects.joined.lead,
                  case: "dat" as const,
                },
              ] as [
                { ref: "lead"; id: TerminalId; case: "acc" },
                { ref: "lead"; id: TerminalId; case: "dat" },
              ],
            }
          : {
              ns: "activity" as const,
              k: "leadLoosened" as const,
              args: [
                { ref: "lead" as const, id: lead, case: "acc" as const },
              ] as [{ ref: "lead"; id: TerminalId; case: "acc" }],
            },
    };
  },

  async verify_current_step(_input, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const step = stepById(state.activeStepId);

    await ctx.phase({ ns: "phases", k: "rereading" }, 400);
    await ctx.phase({ ns: "phases", k: "comparingExpected" }, 480);

    /* The three ways a step can fail, added up. Strays are in the sum because
       a step that fails only on a join the sketch does not ask for would
       otherwise report `0 issues still open` and then refuse to tick — the
       interface contradicting itself in two adjacent sentences. */
    const openCount = (r: ReturnType<typeof verifyStep>) =>
      r.expected - r.matched + (r.mechanicalOk ? 0 : 1) + r.strays;

    /* `verified` is re-derived rather than taken: see `fullyVerified`. The rest
       of the record is the measurement exactly as it was made. */
    const measured = verifyStep(state.scene, state.activeStepId);
    const report = { ...measured, verified: fullyVerified(measured) };
    const open = openCount(report);

    if (!report.verified) {
      /**
       * §9: *"Başarısız: yapılandırılmış hata döndür, ilgili finding'i görünür
       * yap."* The second half was missing entirely.
       *
       * The failure branch returned the report and a timeline note and nothing
       * else: no patch, no effect, no tab change, no finding. So a person who
       * had not run `inspect_build` first saw the activity tab — which is not
       * the tab the panel is on — say `4 issues still open` while the Findings
       * tab said there was nothing open on this step. The success half has
       * always been fully honoured; this is the other one.
       *
       * Derived rather than only pointed at, because on the common path there
       * is nothing to point at: findings are born in `inspect_build`, and the
       * whole complaint is about the person who pressed Verify without looking
       * first. Same scope, same `kept` rule and same credit scoping as an
       * inspection, so the two tools cannot disagree about the table.
       */
      const found = deriveFindings(
        state.scene,
        "current_step",
        state.activeStepId,
        Date.now(),
      );
      const kept = state.findings.filter(
        (finding) =>
          !isResolved(finding, state.scene) &&
          !inspectionCovers(finding, "current_step", state.activeStepId) &&
          !found.some((fresh) => fresh.id === finding.id),
      );
      const findings = [...kept, ...found];
      const point = found[0]?.id ?? null;

      return {
        status: "ok",
        result: {
          ...report,
          /* `findingIds`, not `findings`. `inspect_build.findings` is a list of
             objects and this is a list of ids, and one word cannot mean both in
             a layer an agent reads in sequence — the two never appear in one
             body, so nothing was ever wrong on screen, but a client written
             against either name is written against the other's shape. The rule
             this pass settles: `findings` always means the objects. */
          findingIds: found.map((f) => f.id),
          source: "demo",
        },
        patch: {
          findings,
          repaired: state.repaired.filter((id) =>
            findings.some((f) => f.id === id),
          ),
          ...(point ? { highlightedFindingId: point } : {}),
          tab: found.length ? ("findings" as const) : state.tab,
        },
        note: {
          headline: {
            ns: "activity" as const,
            k: "stepNotVerified" as const,
            args: [open] as [number],
          },
          tone: "found" as const,
        },
        effects: [
          {
            kind: "toast" as const,
            tone: "warning" as const,
            message: say(copy, {
              ns: "activity",
              k: "stepNotVerified",
              args: [open],
            }),
          },
        ],
      };
    }

    /* The report above is 880 ms old and nothing disables the bench while a
       tool is running. `tool/settle` then spreads this patch over whatever the
       person did meanwhile — ticking a step and stamping `completedAt` for a
       build whose resistor has since gone back in the box. A verification is a
       claim about the build as it is now, so it is asked again against the
       state this is about to patch, and the patch below is built from that same
       read rather than from `state`. */
    const live = ctx.read();
    const fresh = verifyStep(live.scene, live.activeStepId);
    /* Two ways this stopped being an answer about the build in front of the
       person, and they are one failure seen from two sides: the step under
       verification broke, or `commit` walked the active step back off it
       because a DIFFERENT step came off while the phases ran. The fresh check
       alone cannot see the second — it only ever asks about one step. */
    if (!fullyVerified(fresh) || live.activeStepId !== state.activeStepId) {
      return {
        status: "ok",
        /* `report`, not `fresh`: this is the measurement the tool actually
           made, and `stale` is the warning that it is no longer an answer
           about the build in front of the person. */
        result: { ...report, verified: false, stale: true, source: "demo" },
        note: {
          headline: {
            ns: "activity" as const,
            k: "stepNotVerified" as const,
            /* Counted from `fresh`, though. `open` was taken before the
               awaits, and this branch only fires when it was zero — so
               reusing it would print `0 issues still open` beside a step
               that has just refused to tick. */
            args: [openCount(fresh)] as [number],
          },
          tone: "found" as const,
        },
      };
    }

    const following = nextStep(state.activeStepId);

    return {
      status: "ok",
      result: { ...report, nextStepId: following?.id ?? null, source: "demo" },
      patch: {
        /* From `live`, never from `state`. A tick landed from the pre-await
           read would spread away a regression `commit` recorded during the
           phases above — restoring a green tick, and the `completedAt` that
           offers `Finish`, for a step whose lead is now on the floor. */
        completedSteps: [...new Set([...live.completedSteps, step.id])],
        activeStepId: following?.id ?? state.activeStepId,
        /* Batch 8 · the last tick closes the build. Stamped here rather than by
           the screen that reads it, because this is the moment it happened —
           and the workbench does not throw the person out when it does. The
           foot changes to `Finish` and the door is offered, not walked
           through.

           Idempotent by hand, the same shape and for the same reason as
           `tools.ts:317`'s guard on `startedAt`: `summary-blocks.tsx` subtracts
           one of these from the other, and one end of that subtraction was
           hand-guarded against a repeat while this one re-stamped on every
           call. The printed figure is whole minutes and rarely moved — the
           asymmetry is the defect, not the drift. `live`, not `state`: the
           stamp being guarded is the one already on the build. */
        ...(following || live.completedAt !== null
          ? {}
          : { completedAt: Date.now() }),
        highlightedFindingId: null,
        /* The findings that belonged to the step that just closed. Carrying
           them into the next one would let the panel claim every connection
           matches on a step the agent has not looked at — the resolved rows go
           with the step, and the timeline keeps the record either way.

           **Only that step's**, though. Emptying the whole list threw away
           everything the agent had found about steps the person had not
           finished — a stray join two steps ahead, or a part still in the box —
           so a build could be verified forward past faults the panel had
           already reported and then had no record of. */
        findings: live.findings.filter((f) => f.stepId !== step.id),
        /* And what was paid for goes with them, on the same scoping. `repairs`
           keeps the total; this only says which of the findings still on the
           table were already counted. */
        repaired: live.repaired.filter((id) =>
          live.findings.some((f) => f.id === id && f.stepId !== step.id),
        ),
        tab: "guidance" as const,
      },
      note: {
        headline: { ns: "activity" as const, k: "stepVerified" as const },
        tone: "passed" as const,
      },
      effects: [
        { kind: "trace" as const, connectionIds: step.connections },
        { kind: "fitView" as const },
        {
          kind: "toast" as const,
          tone: "success" as const,
          message: copy.workbench.stepVerified,
        },
      ],
    };
  },

  async navigate_build_step({ step_id }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;

    /**
     * The step has to belong to the build on the bench.
     *
     * `stepById` is a GLOBAL search across all 33 ids and the handler asked it
     * nothing else — so chapter one's bench accepted `sensor`, wrote it into
     * `activeStepId`, and every reader downstream derives the build from the
     * step: the rail redrew as the capstone's seven, the topbar said `of 7`, the
     * instruction was another chapter's, and `get_build_context` reported
     * project "Breathing Lamp" with a step about a distance sensor. There was no
     * UI route back, because the rail the person clicks is the same derivation.
     * Then `verify_current_step` ticked the foreign step green: `diff` filters
     * `scene.expected`, so ids this build has never heard of yield zero
     * mismatches (see `fullyVerified`).
     *
     * `webmcp.ts` publishes the right enum, and that is not the same as
     * enforcing it — `use-webmcp.ts` says out loud that it expects hosts which
     * do not. The rail is taken from the build's ROW rather than from
     * `state.activeStepId`, so one bad navigate could not make the next one look
     * legal even if this guard were ever removed.
     */
    const rail = stepsOwning(
      buildFor(state.projectId)?.activeStepId ?? state.activeStepId,
    );
    const step = rail.find((s) => s.id === step_id);
    if (!step) {
      /* The sentence says how many steps this build has; `result.valid` says
         which. Deliberately not the ids: `mnlPower` is a graph address that
         appears nowhere a person can see, and this campaign has just spent a
         commit taking those out of rendered sentences. Their translated NAMES
         cannot go there either — joining them at the call site would freeze a
         translated argument in the language it was built in, which is the one
         thing `line.ts` exists to prevent. The agent gets the ids below, where
         a list belongs. */
      return refused(
        { ns: "errors", k: "unknownStep", args: [rail.length] },
        {
          argument: "step_id",
          value: step_id ?? null,
          valid: rail.map((s) => s.id),
        },
      );
    }

    if (step.id === state.activeStepId) {
      return {
        status: "ok",
        /* The same four keys the moved arm returns, so the shape stops varying
           on the one thing a caller most wants to compare. `name` and
           `skippedSteps` used to go missing here, which left a client reading
           `result.name` an `undefined` on the arm where nothing went wrong —
           and `skippedSteps` is genuinely empty, not unknown: a jump to the
           step you are standing on passes nothing. `changed` is the fact the
           handler already had and only the timeline was told. */
        result: {
          stepId: step.id,
          name: stepWords(copy, step.id).name,
          skippedSteps: [],
          changed: false,
          source: "demo",
        },
        outcome: {
          ns: "activity" as const,
          k: "alreadyOnStep" as const,
          args: [step.index] as [number],
        },
      };
    }

    await ctx.phase({ ns: "phases", k: "loadingStep" }, 260);

    /**
     * Steps this jump goes **past** without their being finished.
     *
     * Navigation is allowed to skip — a person reading ahead is a normal thing
     * to do, and refusing would make the tool useless for the case it exists
     * for. What is not allowed is doing it silently: an agent that placed every
     * part and then jumped to the last step produced a build reporting a pass
     * with three steps still marked `Not started`, and nothing anywhere said
     * that had happened. So the call reports it and the timeline records it.
     *
     * The index is guarded rather than sliced with: `findIndex` answers `-1` for
     * a step that is not in the list and `slice(0, -1)` is then *every step but
     * the last* — so a cross-chapter jump used to report five skipped steps that
     * were never on the path to anything, in the timeline and in the tool's own
     * result. The refusal above makes that unreachable; the arithmetic should
     * not be left standing either way.
     */
    const at = rail.findIndex((s) => s.id === step.id);
    const skipped = (at < 0 ? [] : rail.slice(0, at))
      .filter((s) => !state.completedSteps.includes(s.id))
      .map((s) => s.id);

    return {
      status: "ok",
      result: {
        stepId: step.id,
        name: stepWords(copy, step.id).name,
        skippedSteps: skipped,
        changed: true,
        source: "demo",
      },
      ...(skipped.length
        ? {
            note: {
              headline: {
                ns: "activity" as const,
                k: "skippedSteps" as const,
                args: [skipped.length] as [number],
              },
              tone: "found" as const,
            },
          }
        : {}),
      patch: {
        activeStepId: step.id,
        highlightedFindingId: null,
        inspectedStepId: null,
        tab: "guidance" as const,
      },
      /* The step's name is a `Ref`, not a word: it is translated too, and a
         copy of it here would freeze with the rest of the entry. */
      outcome: {
        ns: "activity" as const,
        k: "movedToStep" as const,
        args: [step.index, { ref: "step" as const, id: step.id }] as [
          number,
          { ref: "step"; id: StepId },
        ],
      },
      effects: [{ kind: "fitView" as const }],
    };
  },

  /**
   * The build's own test, asked of the build.
   *
   * Everything that used to be written here — which checks exist, what they
   * measure, what the board prints while they run — is now a row in the
   * registry (`lib/device/run-spec.ts`). What is left is the two things a tool
   * does: honour its argument, and report.
   *
   * **The argument is honoured.** `test` used to be accepted, echoed back and
   * ignored: asking for `servo` ran all three checks and returned all three
   * results. A named check now runs alone, and the rows it did not run are
   * reported as skipped rather than silently passing.
   */
  async run_functional_test({ test }, ctx) {
    const state = ctx.read();
    const copy = ctx.copy;
    const build = buildFor(state.projectId);

    if (!build) {
      /* Unreachable — `builds.ts` throws at boot if a ready project has no row
         — and still routed through `refused()`, because `"refused" in body` is
         only a reliable branch if every error path in the layer carries the key.
         Not an argument error: `test` is not what is wrong here. */
      return refused(
        { ns: "errors", k: "noBench" },
        { project: state.projectId },
      );
    }

    const all = build.run.checks;
    const wanted =
      test === "full_system" ? all : all.filter((check) => check.id === test);

    if (!wanted.length) {
      return refused(
        {
          ns: "errors",
          k: "unknownCheck",
          args: [all.map((check) => check.id).join(", ")],
        },
        {
          argument: "test",
          value: test ?? null,
          /* `full_system` is in the domain and in the published enum, and it is
             deliberately not in the sentence: that one names the checks this
             build actually runs. The list is what the argument accepts. */
          valid: [...all.map((check) => check.id), "full_system"],
        },
      );
    }

    await ctx.phase({ ns: "phases", k: "runningTest" }, 900);

    /* Measured against the build as it is *now*, not as it was when the call
       started — the same freshness rule `verify_current_step` keeps. */
    const live = ctx.read();
    const results: TestCheck[] = wanted.map((check) => ({
      check: check.id,
      passed: check.passes(live.scene),
      detail: check.detail(live.scene),
    }));
    const failed = results.filter((r) => !r.passed).length;

    return {
      status: "ok",
      result: {
        test,
        ran: results.map((r) => r.check),
        skipped: all
          .map((check) => check.id)
          .filter((id) => !results.some((r) => r.check === id)),
        results,
        source: "demo",
      },
      note: failed
        ? {
            headline: {
              ns: "activity" as const,
              k: "testFailed" as const,
              args: [failed] as [number],
            },
            tone: "failed" as const,
          }
        : {
            headline: { ns: "activity" as const, k: "testPassed" as const },
            tone: "passed" as const,
          },
      /* The run plays either way — a failing test is the thing this product
         most needs to show. Only the toast is conditional, because there is
         nothing to congratulate. */
      effects: [
        {
          kind: "runTest" as const,
          results,
          checks: all.map((check) => check.id),
        },
        ...(failed
          ? []
          : [
              {
                kind: "toast" as const,
                tone: "success" as const,
                message: say(copy, { ns: "activity", k: "testPassed" }),
              },
            ]),
      ],
    };
  },
};

/**
 * The human sentence an entry opens with, before the call has finished.
 *
 * **Total, for every argument a browser can send.** This is composed as an
 * argument to `tool/start`, which sits outside the runner's try — so a throw in
 * here does not become an error result, it escapes `execute` entirely: no
 * activity entry, no settle, no toast, no announcement, and a raw JS
 * `TypeError` handed to the agent as its error message. Two lines could throw:
 * `stepById(input.step_id).index` for an id no build has, and
 * `input.test.replace(...)` for a call with no `test` at all — which the handler
 * has a perfectly good refusal for and never reached. A headline is what an
 * entry opens with; deciding whether the call is recorded at all is not its job.
 */
export function headlineFor<K extends keyof ToolInputs>(
  name: K,
  input: ToolInputs[K],
  state: AgentSessionState,
): Line {
  const step = stepById(state.activeStepId);

  switch (name) {
    case "inspect_build": {
      const scope = (input as ToolInputs["inspect_build"]).scope;
      if (scope === "mechanical")
        return { ns: "activity", k: "inspectingMechanical", args: [step.index] };
      if (scope === "all" || scope === "wiring")
        return { ns: "activity", k: "inspectingAll" };
      /* `placement` is the one scope that explicitly excludes wiring —
         `scopeKinds("placement")` admits placement findings and nothing else —
         and it fell through to the sentence naming wiring, on five of the six
         chapters. The timeline announced the one thing the call did not do. */
      if (scope === "placement")
        return { ns: "activity", k: "inspectingPlacement", args: [step.index] };
      return { ns: "activity", k: "inspecting", args: [step.index] };
    }
    case "show_correction": {
      /* Three sentences, chosen by what is actually being pointed at. This was
         unconditional, so on a fresh chapters 1-5 bench — where every finding is
         a part still in the box — every `show_correction` in the opening of five
         chapters was described as pointing at a connection that does not exist,
         and on the capstone the servo horn got the same line. The dictionary
         already knew the distinction: `mismatchFound`'s note says a servo "is
         not a connection mismatch, and saying so would be the interface telling
         the user something it knows to be untrue." */
      const id = (input as ToolInputs["show_correction"]).finding_id;
      const finding = state.findings.find((f) => f.id === id);
      if (finding?.type === "part-not-placed")
        return { ns: "activity", k: "showingCorrectionPart" };
      if (finding?.type === "mechanical-alignment")
        return { ns: "activity", k: "showingCorrectionAlignment" };
      return { ns: "activity", k: "showingCorrection" };
    }
    case "attach_lead": {
      /**
       * A third arm for the call that named nothing.
       *
       * The id used to be coerced to `""` — the lead table answers `undefined`
       * for a missing id and the template would otherwise print the word
       * `undefined` in the timeline — and `""` was the better of those two, not
       * a good answer: the entry read *"Agent moved "*, a sentence with a hole
       * in it, in both languages. `lead` is `required` in the published schema,
       * so this is only reachable through a host that does not enforce one,
       * which `use-webmcp.ts` says out loud that it expects.
       *
       * Still no throw, which is the property that mattered: the entry exists,
       * the call reaches the handler, and the handler's own refusal is what
       * says which argument was missing. This only stops the timeline claiming
       * a subject it does not have.
       */
      const lead = (input as ToolInputs["attach_lead"]).lead;
      if (typeof lead !== "string" || !lead)
        return { ns: "activity", k: "calledTool" };
      return {
        ns: "activity",
        k: "attachingLead",
        args: [{ ref: "lead", id: lead, case: "acc" }],
      };
    }
    case "verify_current_step":
      return { ns: "activity", k: "verifying", args: [step.index] };
    case "navigate_build_step": {
      /* This build's rail, and `0` for anything not on it — the handler is what
         refuses, and it needs the entry to exist first in order to say so. */
      const asked = (input as ToolInputs["navigate_build_step"]).step_id;
      const target = stepsOwning(state.activeStepId).find(
        (s) => s.id === asked,
      );
      return { ns: "activity", k: "navigating", args: [target?.index ?? 0] };
    }
    case "run_functional_test": {
      /**
       * A `Ref`, not the raw id.
       *
       * `copy.test.<id>` is the product's own translated word for a check and
       * the device dock beside the panel renders exactly that — so carrying the
       * id as text put *"Ajan wiring testini çalıştırdı"* in the Turkish
       * timeline next to a row reading `Bağlantılar okunuyor`: one screen
       * naming one check twice, in two languages.
       *
       * The sentence had to move with it. `copy.test` holds the row's
       * *activity* — "Reading the connections", "Can the lamp breathe" — and
       * the template used to read `Agent ran the ${test} test`, which would
       * have produced "Agent ran the Can the lamp breathe test". It is an
       * apposition now, so a phrase reads correctly where an id did.
       *
       * And the same empty-subject arm `attach_lead` has above: a call with no
       * `test` used to open its entry with *"Agent ran the check: "*. It still
       * does not throw, so the handler's `unknownCheck` is still what names the
       * mistake.
       */
      const test = (input as ToolInputs["run_functional_test"]).test;
      if (typeof test !== "string" || !test)
        return { ns: "activity", k: "calledTool" };
      return {
        ns: "activity",
        k: "testing",
        args: [{ ref: "check", id: test }],
      };
    }
    /* `get_build_context` and anything a later batch adds. */
    default:
      return { ns: "activity", k: "readContext" };
  }
}

/** Builds the call record an entry carries from its first frame. */
export function toolCallOf(
  id: string,
  name: AgentTool,
  input: unknown,
): ToolCall {
  const args = (input ?? {}) as Record<string, unknown>;
  return {
    id,
    name,
    args,
    argsSummary: summariseArgs(args),
    status: "running",
    startedAt: Date.now(),
  };
}

export { clockOf };
