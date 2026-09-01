import { describe, expect, it } from "vitest";
import { diff, extras, type CircuitScene } from "@/lib/circuit/graph";
import type {
  Placement,
  PlacementSpec,
  TerminalId,
} from "@/lib/circuit/placement";
import type { NodeId } from "@/lib/circuit/graph";
import type { CheckSpec } from "@/lib/device/run-spec";
import { lightPlacement } from "@/lib/circuit/traffic-light";
import { nightPlacement } from "@/lib/circuit/motion-night-light";
import { plantPlacement } from "@/lib/circuit/plant-guardian";
import { soapPlacement } from "@/lib/circuit/touchless-soap";
import {
  nightRun,
  plantRun,
  soapRun,
  trafficRun,
} from "@/lib/device/run-spec";

/**
 * THE TRIPWIRE: a bench that is not the sketch's circuit must not verify.
 *
 * ## What this file is for
 *
 * Four M–M jumpers out of one bag are one object, and every chapter with cables
 * has to say two things at once: a cable somebody picked up in a different
 * order is still the right build, and a cable making a join the sketch does not
 * ask for is not. Every chapter said the first and none of them said the second
 * — chapter two put all eight cable ends in one `interchangeable` class, and
 * chapters three to five narrowed it to an assignment and then published that
 * assignment as a symmetric alias, which four cables can compose back into a
 * cycle.
 *
 * The cost was not caught by any test in this repo because every test here
 * spot-checked NAMED permutations. What was missing is a count, and it is the
 * only assertion in this file that matters:
 *
 *   **accepted − physically equivalent = 0.**
 *
 * Both halves are load-bearing. A model that reported everything would score
 * zero here too, so the same sweep asserts the other direction: every layout
 * that IS the sketch's circuit verifies, and passes every functional check.
 *
 * ## The sample, and why it is not the whole space
 *
 * The whole space is 8! = 40 320 seatings per chapter, which is a 15-second
 * sweep across three chapters — too slow to sit in `npm test`. So the eight-end
 * chapters walk a **bounded, structured sample** (see `sample`) rather than the
 * full permutation set: every single transposition, every whole-cable exchange,
 * every cable turned end for end, and every combination of those with one
 * another, plus a seeded pseudo-random tail. Chapter five has six ends and its
 * 720 seatings are swept exhaustively, so the property is proved outright
 * somewhere and sampled everywhere else.
 *
 * If a change here ever needs the exhaustive answer, raise `EXHAUSTIVE_ENDS` to
 * 8 and expect ~15 s.
 */

/** Above this many cable ends the sweep samples instead of enumerating. */
const EXHAUSTIVE_ENDS = 6;

interface Bench {
  name: string;
  spec: PlacementSpec;
  checks: readonly CheckSpec[];
}

const BENCHES: Bench[] = [
  { name: "chapter two · traffic light", spec: lightPlacement, checks: trafficRun.checks },
  { name: "chapter three · motion night light", spec: nightPlacement, checks: nightRun.checks },
  { name: "chapter four · plant guardian", spec: plantPlacement, checks: plantRun.checks },
  { name: "chapter five · touchless soap", spec: soapPlacement, checks: soapRun.checks },
];

const AT_REST = { servoAngle: 0, expectedAngle: 0 };

/** The cables: flexible parts named `wire*`, each with exactly two ends. */
function cablesOf(spec: PlacementSpec): { ends: [TerminalId, TerminalId] }[] {
  return (spec.flexible ?? [])
    .filter((part) => part.startsWith("wire"))
    .map((part) => spec.terminalsOf[part] ?? [])
    .filter((ends) => ends.length === 2)
    .map((ends) => ({ ends: [ends[0]!, ends[1]!] as [TerminalId, TerminalId] }));
}

function* permutations<T>(items: readonly T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield [...items];
    return;
  }
  for (let i = 0; i < items.length; i += 1) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) yield [items[i]!, ...tail];
  }
}

/**
 * A bounded stand-in for the full permutation set.
 *
 * Chosen rather than sampled at random, because the shapes that broke this are
 * shapes and not accidents: one end moved (a transposition), two cables
 * exchanged whole, and a cable turned round. Every pair of those is included
 * too, which is where the composing-alias cycle lived. The random tail is
 * seeded so a failure is reproducible.
 */
function sample(seats: readonly NodeId[], cables: number): NodeId[][] {
  const out: NodeId[][] = [seats.slice()];
  const swap = (order: NodeId[], i: number, j: number) => {
    const next = order.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };

  /* Every transposition of two seats, and every transposition of a
     transposition — 8!/(6!·2!) = 28 of the first and 28² of the second. */
  const singles: NodeId[][] = [];
  for (let i = 0; i < seats.length; i += 1) {
    for (let j = i + 1; j < seats.length; j += 1) singles.push(swap(seats.slice(), i, j));
  }
  out.push(...singles);
  for (const first of singles) {
    for (let i = 0; i < seats.length; i += 1) {
      for (let j = i + 1; j < seats.length; j += 1) out.push(swap(first, i, j));
    }
  }

  /* Whole cables exchanged and whole cables turned round, in every subset. */
  for (let mask = 0; mask < 1 << cables; mask += 1) {
    const turned = seats.slice();
    for (let c = 0; c < cables; c += 1) {
      if (mask & (1 << c)) [turned[2 * c], turned[2 * c + 1]] = [turned[2 * c + 1]!, turned[2 * c]!];
    }
    out.push(turned);
    for (let a = 0; a < cables; a += 1) {
      for (let b = a + 1; b < cables; b += 1) {
        const exchanged = turned.slice();
        [exchanged[2 * a], exchanged[2 * b]] = [exchanged[2 * b]!, exchanged[2 * a]!];
        [exchanged[2 * a + 1], exchanged[2 * b + 1]] = [
          exchanged[2 * b + 1]!,
          exchanged[2 * a + 1]!,
        ];
        out.push(exchanged);
      }
    }
  }

  /* A seeded tail, so the sweep is not only the shapes somebody thought of. */
  let seed = 20260901;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 3000; n += 1) {
    const order = seats.slice();
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    out.push(order);
  }
  return out;
}

interface Sweep {
  seatings: number;
  /** Verified as finished: nothing missing and nothing extra. */
  accepted: number;
  /** Physically the sketch's circuit — every cable across one expected pair. */
  equivalent: number;
  /** Accepted but a different circuit. This is the number that must be zero. */
  falsePositives: string[];
  /** The sketch's own circuit, reported as wrong. Must also be zero. */
  falseNegatives: string[];
  /** Equivalent layouts that fail one of the chapter's own run checks. */
  failedChecks: string[];
}

function sweep(bench: Bench): Sweep {
  const spec = bench.spec;
  const cables = cablesOf(spec);
  const ends = cables.flatMap((c) => c.ends);
  const seats = ends.map((e) => spec.complete[e]!);
  /* A pair, as an unordered pair of seats: turning a cable round is the same
     circuit and must not read as a different one. */
  const key = (a: NodeId, b: NodeId) => [a, b].sort().join(" | ");
  const truePairs = new Set(
    cables.map((c) => key(spec.complete[c.ends[0]]!, spec.complete[c.ends[1]]!)),
  );

  const orders =
    ends.length <= EXHAUSTIVE_ENDS
      ? [...permutations(seats)]
      : sample(seats, cables.length);

  const result: Sweep = {
    seatings: orders.length,
    accepted: 0,
    equivalent: 0,
    falsePositives: [],
    falseNegatives: [],
    failedChecks: [],
  };

  for (const order of orders) {
    const placement: Record<TerminalId, NodeId | null> = { ...spec.complete };
    ends.forEach((end, i) => {
      placement[end] = order[i]!;
    });
    const scene: CircuitScene = spec.sceneFrom(placement as Placement, AT_REST);
    const green =
      diff(scene).mismatches.length === 0 && extras(scene).length === 0;
    const equivalent = cables.every((c) =>
      truePairs.has(key(order[ends.indexOf(c.ends[0])]!, order[ends.indexOf(c.ends[1])]!)),
    );
    if (green) result.accepted += 1;
    if (equivalent) result.equivalent += 1;

    const layout = () => ends.map((e, i) => `${e}→${order[i]}`).join("  ");
    if (green && !equivalent && result.falsePositives.length < 4)
      result.falsePositives.push(layout());
    if (!green && equivalent && result.falseNegatives.length < 4)
      result.falseNegatives.push(layout());
    if (equivalent && result.failedChecks.length < 4) {
      const failed = bench.checks.filter((c) => !c.passes(scene));
      if (failed.length)
        result.failedChecks.push(`${failed.map((c) => c.id).join(", ")} on ${layout()}`);
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */

describe.each(BENCHES)("$name · seating the cable ends", (bench) => {
  const result = sweep(bench);

  /**
   * The assertion the whole file exists for.
   *
   * Not "few" and not "fewer than before": a build that is not the circuit the
   * sketch asks for cannot be called finished, and there is no number of them
   * that is acceptable. Before the pairing rule this was 39 936 on chapter two
   * and 288 · 288 · 16 on chapters three, four and five.
   */
  it("accepts no seating that is a different circuit", () => {
    expect(result.falsePositives).toEqual([]);
  });

  /**
   * And the other direction, which is the one that matters to a person.
   *
   * Nobody can tell four identical jumpers apart, so every way of laying the
   * same circuit out with them is the same build and must verify. Telling a
   * correct bench it is wrong is the one thing this product must not do.
   */
  it("accepts every seating that IS the sketch's circuit", () => {
    expect(result.falseNegatives).toEqual([]);
    expect(result.accepted).toBe(result.equivalent);
    expect(result.equivalent).toBeGreaterThan(0);
  });

  /**
   * The functional checks read the metal, not the cable's file name.
   *
   * Chapter two's `sequence` check used to look up `wire.red.pin` by name: of
   * the 384 correct layouts, 382 failed a test they should pass, with nothing
   * for the panel to point at — the failure mode `nightLines` was written to
   * avoid and `run-spec.ts` now follows on every chapter.
   */
  it("passes every one of its own run checks on every equivalent seating", () => {
    expect(result.failedChecks).toEqual([]);
  });
});

/**
 * The exhaustive answer, kept for the one chapter cheap enough to prove it on.
 *
 * Three cables, six ends, 720 seatings, and exactly 3! · 2³ = 48 of them are the
 * same circuit. That is the closed form the sampled chapters are asserting a
 * shadow of, so it is worth having somewhere in full.
 */
describe("chapter five, swept exhaustively", () => {
  it("verifies 48 of its 720 seatings, and they are the 48 that are the build", () => {
    const result = sweep(BENCHES[3]!);
    expect(result.seatings).toBe(720);
    expect(result.equivalent).toBe(48);
    expect(result.accepted).toBe(48);
  });
});
