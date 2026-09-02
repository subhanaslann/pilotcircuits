import { BOOM, ECHO, P, PIVOT } from "@/components/landing/scene/bench-layout";
import {
  GRIP_AT,
  SEAT_AT,
  durationOf,
  type MascotJob,
} from "@/lib/agent/mascot";

/**
 * S-01 · A build that does not work, and what fixing it looks like.
 *
 * ## Why the bench no longer repairs itself
 *
 * It used to play the whole thing on scroll — broken, agent, fixed, car
 * through — and that was the wrong shape twice over. The ring lasts about a
 * second and a half of an eight second run, so by the time anyone looked at
 * the bench it had already been and gone; and what it was competing against
 * was *a car driving across the frame*. An attribution cue cannot win an
 * argument with a car.
 *
 * So the bench arrives **stuck**. A car pulls up to a barrier that will not
 * open, the sensor pings, the red light stays on, and nothing happens. That is
 * a question rather than a demonstration, and the answer is one call away.
 *
 * When the call comes — from the plate on the bench, or from a real WebMCP
 * client, which is the same call — three things make the ring impossible to
 * miss: the viewer is already looking (they asked), the rest of the bench
 * **drains to grey** while the agent works, and the payoff comes *after* the
 * ring rather than on top of it. The gate opens because the ring came, and
 * there is nothing else on screen it could have been.
 *
 * ## The ring is the product's, and so is its clock
 *
 * This film used to carry a ring of its own: a second choreography, in scene
 * units, that came out of the plate the help was asked from. The bench has
 * since grown the real one — `lib/agent/mascot.ts`, drawn in a screen-space
 * layer, leaving the coach figure and returning to it — and the two drifted
 * exactly as two copies of a mascot do. So the ring here is now the bench's
 * ring doing its `carry` job (`REPAIR`, below), flown by
 * `use-bench-mascot.ts` from the same call that starts this film; what this
 * file still owns is everything the ring acts *on*: the cable it moves, the
 * bench draining while it has hold of it, and the board running afterwards.
 *
 * The two clocks agree by construction rather than by tuning: the cable
 * lifts at `GRIP_AT` and seats at `SEAT_AT`, which are the ring's own beats,
 * exported for exactly this reason (`attach_lead` reads the same two).
 *
 * ## Nothing here imports React
 *
 * Same rule as `lib/agent/`: the model is a function of a mode and a clock, and
 * the store is three closures over them.
 */

export type Mode = "stuck" | "fixing" | "done";

/* --- The ring's two jobs on this bench ----------------------------------- */

const on = (p: { x: number; y: number }) =>
  ({ kind: "scene", x: p.x, y: p.y }) as const;

/**
 * `show_correction`: the Echo leg out of D6 and into D7.
 *
 * A carry rather than the workbench's point, and on purpose: on the bench the
 * agent shows and the learner moves the wire, and the ring parks on the wrong
 * hole. Here the ask is *fix the wire*, and the film has always been the
 * agent doing it — so the ring gets the one job that gives it hands.
 */
export const REPAIR: MascotJob = {
  kind: "carry",
  from: on(ECHO.wrong),
  to: on(ECHO.right),
};

/**
 * `inspect_build`: a look along the signal path — the sensor's Trig and
 * Echo, and the two header pins they land on — in the order the current
 * reads. Four stops, which is the workbench's own ceiling for a read, and
 * the last of them is the hole the repair then starts from.
 */
export const INSPECTION: MascotJob = {
  kind: "read",
  over: [on(P.sensorTrig), on(P.d8), on(P.sensorEcho), on(P.d6)],
};

/**
 * When the ring has let go and gone home: the carry's full flight with a
 * lamp to return to. The bench takes its colour back over the last leg.
 */
const RING_GONE = durationOf(REPAIR, { home: { kind: "coach" } });

/* --- The beats of a repair ------------------------------------------------ */

/** The board does not wait for the agent to get out of the way. */
const RUN_MS = 5600;

/** The run starts on the frame the cable seats, and this is where it ends. */
export const TOTAL = SEAT_AT + RUN_MS;

/**
 * How long the working build is left standing, at the end of the run, before
 * the fault goes back. Part of the run itself, so the frame `done` holds is a
 * working bench: the dip that covers the swap sits in the last 260 ms of the
 * cycle, not of `TOTAL`. It used to close at `TOTAL`, so `done` was the
 * fully dipped frame, and the entry screen showed an empty mat for the whole
 * rest — on the plate's own path as much as on an agent's.
 */
export const REST = 2600;
/** The run and its rest. The fault is due back when this ends. */
export const CYCLE = TOTAL + REST;

/** How long the car takes to roll up when the bench first comes into view. */
export const ARRIVAL = 1700;

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeBoth = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

/** The cable's move, 0–1: from the ring taking hold to the leg seating. */
const transport = (t: number) =>
  clamp01((t - GRIP_AT) / (SEAT_AT - GRIP_AT));

/** A window in run-time: 0 before, 0..1 across, 1 after. */
const win = (t: number, a: number, b: number) =>
  clamp01((t - SEAT_AT - a) / (b - a));

/* --- Where things are ---------------------------------------------------- */

/**
 * How far a stiff leg comes out of its socket before it travels, in scene
 * units. The ring lifts by sixteen pixels on the way across; at the width
 * this bench is drawn at that is about twenty, so the leg rides in the ring
 * rather than under it.
 */
const LIFT = 20;

/** Off the left edge, stopped at the line, and away past the right. */
const CAR = { in: -150, stop: PIVOT.x - 282, out: 1340 } as const;

export interface Frame {
  mode: Mode;
  echo: { x: number; y: number; lifted: number };
  /** Cable ids carrying a pulse right now, and how far along, 0–1. */
  pulses: Record<string, number>;
  green: number;
  red: number;
  boom: number;
  car: number | null;
  sonar: number;
  /**
   * How far the whole drawing is dipped out, 0–1.
   *
   * The demo puts the fault back so it can be watched again, and a cable
   * jumping a hole on its own would read as the agent undoing its own work.
   * A short dip covers the swap and says what it is: the demo starting over.
   */
  dip: number;
  /**
   * How far the bench has drained of colour, 0–1.
   *
   * The product's own device, turned up: on the canvas the *other cables* drop
   * to grey when the agent is talking about one of them, because eight faint
   * coloured wires still compete for attention while one neutral field does
   * not. Here the whole bench does it, so a blue ring and one amber cable are
   * the only coloured things left on screen.
   */
  drain: number;
  /** Which transcript line the strip should light, or -1. */
  line: number;
}

const PULSE_MS = 560;

/** The order the current actually reaches things. */
const RUN: [string, number][] = [
  ["c.rail.pos", 0],
  ["c.rail.neg", 110],
  ["c.sensor.vcc", 360],
  ["c.sensor.gnd", 450],
  ["c.sensor.trig", 700],
  ["c.sensor.echo", 900],
  ["c.led.red", 1500],
  ["c.led.red.gnd", 1580],
  ["c.led.green", 1700],
  ["c.led.green.gnd", 1780],
  ["c.servo.signal", 2200],
  ["c.servo.power", 2280],
  ["c.servo.gnd", 2360],
];

/* --- The stuck bench ----------------------------------------------------- */

function stuckFrame(t: number): Frame {
  return {
    mode: "stuck",
    echo: { ...ECHO.wrong, lifted: 0 },
    pulses: {},
    green: 0,
    /* Not dark: a build with a wrong wire is not a dead build, it is a build
       giving you the wrong answer, and that is the harder thing to notice. */
    red: 1,
    boom: BOOM.closed,
    car: lerp(CAR.in, CAR.stop, easeBoth(clamp01(t / ARRIVAL))),
    /* The sensor is fine and it never stops saying so. What is broken is the
       line carrying its answer back. */
    sonar: clamp01((t - ARRIVAL * 0.45) / 500),
    drain: 0,
    dip: 1 - clamp01(t / 260),
    line: t > ARRIVAL * 0.8 ? 2 : -1,
  };
}

/* --- The repair ---------------------------------------------------------- */

/**
 * The cable's board end, and how high the leg is standing out of its hole.
 *
 * On the ring's own travel curve — `easeBoth` across, a sine lift — so the
 * leg stays in the ring for the whole crossing instead of setting off before
 * it or arriving after it.
 */
function echoAt(t: number) {
  const m = transport(t);
  const height = m > 0 && m < 1 ? Math.sin(Math.PI * m) : 0;
  const along = easeBoth(m);
  return t >= SEAT_AT
    ? { ...ECHO.right, lifted: 0 }
    : {
        x: lerp(ECHO.wrong.x, ECHO.right.x, along),
        y: lerp(ECHO.wrong.y, ECHO.right.y, along) - LIFT * height,
        lifted: height,
      };
}

function fixingFrame(t: number): Frame {
  const pulses: Record<string, number> = {};
  const u = t - SEAT_AT;
  if (u > 0) {
    for (const [id, start] of RUN) {
      const p = (u - start) / PULSE_MS;
      if (p > 0 && p < 1) pulses[id] = p;
    }
  }

  const green = easeBoth(win(t, 1800, 2200)) * (1 - easeBoth(win(t, 4400, 4900)));
  const away = easeBoth(win(t, 3300, 4200));

  /* Grey while the agent has the bench, colour back as it lets go: the
     drain follows the ring in and goes with it on its way home. */
  const drain =
    easeBoth(clamp01(t / 420)) *
    (1 - easeBoth(clamp01((t - (RING_GONE - 420)) / 420)));

  return {
    mode: "fixing",
    echo: echoAt(t),
    pulses,
    green,
    red: 1 - green,
    /* Open for the car, shut behind it. A barrier that stays up is a barrier
       that has stopped being one. */
    boom: lerp(
      BOOM.closed,
      BOOM.open,
      easeBoth(win(t, 2500, 3400)) * (1 - easeBoth(win(t, 4300, 5000))),
    ),
    car: lerp(CAR.stop, CAR.out, away),
    sonar: 1 - clamp01(win(t, 3400, 3800)),
    drain,
    dip: easeBoth(clamp01((t - (CYCLE - 260)) / 260)),
    line: t < SEAT_AT ? 2 : 3,
  };
}

/* --- The store ----------------------------------------------------------- */

let mode: Mode = "stuck";
let now = 0;
let raf = 0;
/**
 * Whether the last run skipped its animation.
 *
 * A dip is a **transition** — it covers the fault being put back, so the swap
 * does not read as the agent undoing its own work. With animation off there is
 * nothing to cover, and the frame the run lands on is the one where the dip is
 * fully closed: `opacity={1 - f.dip}` then paints the whole bench out, and
 * somebody with reduced motion on watched their build vanish for eleven
 * seconds after asking for help.
 */
let still = false;
const listeners = new Set<() => void>();

/**
 * The frame, memoised on the clock.
 *
 * `useSyncExternalStore` compares snapshots by identity, so a fresh object
 * every call would re-render for ever. One object per distinct clock reading
 * keeps the reference stable between renders and still changes when it should.
 */
let cached: Frame = stuckFrame(0);
let cachedKey = "stuck:0";

export function getFrame(): Frame {
  const key = `${mode}:${now}:${still}`;
  if (key !== cachedKey) {
    const frame = mode === "stuck" ? stuckFrame(now) : fixingFrame(now);
    cached = still ? { ...frame, dip: 0 } : frame;
    cachedKey = key;
  }
  return cached;
}

/** Server and first client render agree: the bench opens on the fault. */
const FIRST = stuckFrame(0);
export function getServerFrame(): Frame {
  return FIRST;
}

function emit() {
  cachedKey = "";
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getMode(): Mode {
  return mode;
}

/**
 * Where the film is, for the one control that has to know.
 *
 * The plate's button says "working" only while the ring is at work, and during
 * the rest that follows — the working bench standing there — it offers the run
 * again instead. `mode` alone cannot say which half of `fixing` this is.
 */
export type Phase = "stuck" | "run" | "rest" | "done";

export function getPhase(): Phase {
  if (mode !== "fixing") return mode;
  return now < TOTAL ? "run" : "rest";
}

export function getLine(): number {
  return getFrame().line;
}

export function getServerLine(): number {
  return FIRST.line;
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

/**
 * Two ways of not being able to animate, one answer.
 *
 * Reduced motion is a preference; a hidden tab is a fact — the browser stops
 * `requestAnimationFrame` there and a run left mid-flight would strand the
 * cable between two holes. Either way the bench lands on its end state.
 */
function blind(reduced: boolean) {
  return (
    reduced ||
    (typeof document !== "undefined" && document.visibilityState === "hidden")
  );
}

function drive(limit: number, onEnd?: () => void, reduced = false) {
  stop();
  still = blind(reduced);
  if (blind(reduced)) {
    now = limit;
    onEnd?.();
    emit();
    return;
  }
  const t0 = performance.now();
  const step = (stamp: number) => {
    now = stamp - t0;
    if (now >= limit) {
      now = limit;
      raf = 0;
      onEnd?.();
      emit();
      return;
    }
    emit();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

/** The car rolls up to a barrier that will not open, and waits there. */
export function arrive(reduced: boolean) {
  if (mode !== "stuck" || now > 0) return;
  drive(ARRIVAL, undefined, reduced);
}

/**
 * The repair, from whoever asked for it.
 *
 * The plate on the bench calls it, and so does a WebMCP client the moment it
 * invokes `show_correction` — the same call, the same sequence, no second
 * path. That is the whole point of registering the tool on this route rather
 * than describing it.
 */
export function fix(reduced: boolean) {
  if (mode === "fixing") return;
  mode = "fixing";
  drive(
    CYCLE,
    () => {
      mode = "done";
    },
    reduced,
  );
}

/** Back to a bench that does not work, so it can be asked again. */
export function reset(reduced: boolean) {
  stop();
  mode = "stuck";
  now = 0;
  emit();
  arrive(reduced);
}
