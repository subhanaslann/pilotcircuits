import { BOOM, ECHO, PIVOT } from "@/components/landing/scene/bench-layout";

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
 * ## Nothing here imports React
 *
 * Same rule as `lib/agent/`: the model is a function of a mode and a clock, and
 * the store is three closures over them.
 */

export type Mode = "stuck" | "fixing" | "done";

/* --- The beats of a repair ------------------------------------------------ */

const BEATS = [
  ["notice", 320],
  ["approach", 700],
  ["dock", 280],
  ["grip", 200],
  ["carry", 520],
  ["seat", 280],
  ["retract", 340],
  /** The board does not wait for the agent to get out of the way. */
  ["run", 5600],
] as const;

type Beat = (typeof BEATS)[number][0];

const START: Record<string, number> = {};
const END: Record<string, number> = {};
let clock = 0;
for (const [name, ms] of BEATS) {
  START[name] = clock;
  clock += ms;
  END[name] = clock;
}
export const TOTAL = clock;

/** How long the car takes to roll up when the bench first comes into view. */
export const ARRIVAL = 1700;

function at(beat: Beat, t: number): number {
  const a = START[beat];
  const b = END[beat];
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeBoth = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeBack = (p: number) =>
  1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);

/** Grip, carry and seat as one movement — see the workbench study. */
const transport = (t: number) =>
  clamp01((t - START.grip) / (END.seat - START.grip));

/** A window in run-time: 0 before, 0..1 across, 1 after. */
const win = (t: number, a: number, b: number) =>
  clamp01((t - END.seat - a) / (b - a));

/* --- Where things are ---------------------------------------------------- */

/** How far a stiff leg comes out of its socket before it travels. */
const LIFT = 10;

/** Off the left edge, stopped at the line, and away past the right. */
const CAR = { in: -150, stop: PIVOT.x - 282, out: 1340 } as const;

/** The ring comes out of the plate the help was asked from. */
export const ENTRY = { x: 1046, y: 430 } as const;

export interface MascotFrame {
  x: number;
  y: number;
  r: number;
  dock: number;
  spin: number;
  opacity: number;
}

export interface Frame {
  mode: Mode;
  mascot: MascotFrame | null;
  /**
   * Where the ring was a moment ago, fading.
   *
   * A single outline crossing a busy bench is a thing you can blink past. Three
   * ghosts behind it turn a position into a direction, which is what the eye
   * actually catches — and they cost nothing, being the same function of a
   * clock read three times.
   */
  trail: MascotFrame[];
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
    mascot: null,
    trail: [],
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

/** The cable's board end, and how high the leg is standing out of its hole. */
function echoAt(t: number) {
  const m = transport(t);
  const height = m > 0 && m < 1 ? Math.pow(Math.sin(Math.PI * m), 0.62) : 0;
  const along = easeBoth(clamp01((m - 0.16) / 0.66));
  const echo =
    t >= END.seat
      ? { ...ECHO.right, lifted: 0 }
      : {
          x: lerp(ECHO.wrong.x, ECHO.right.x, along),
          y: lerp(ECHO.wrong.y, ECHO.right.y, along) - LIFT * height,
          lifted: height,
        };
  return { echo, height };
}

function fixingFrame(t: number): Frame {
  const { echo, height } = echoAt(t);

  const pulses: Record<string, number> = {};
  const u = t - END.seat;
  if (u > 0) {
    for (const [id, start] of RUN) {
      const p = (u - start) / PULSE_MS;
      if (p > 0 && p < 1) pulses[id] = p;
    }
  }

  const green = easeBoth(win(t, 1800, 2200)) * (1 - easeBoth(win(t, 4400, 4900)));
  const away = easeBoth(win(t, 3300, 4200));

  /* Grey while the agent has the bench, colour back as it lets go. */
  const drain =
    easeBoth(clamp01((t - START.approach) / 420)) *
    (1 - easeBoth(at("retract", t)));

  const trail = [90, 180, 270]
    .map((back) => {
      const past = echoAt(t - back);
      return mascotAt(t - back, past.echo, past.height);
    })
    .filter((m): m is MascotFrame => m !== null);

  return {
    mode: "fixing",
    mascot: mascotAt(t, echo, height),
    trail,
    echo,
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
    dip: easeBoth(clamp01((t - (TOTAL - 260)) / 260)),
    line: t < END.seat ? 2 : 3,
  };
}

function mascotAt(
  t: number,
  echo: { x: number; y: number },
  height: number,
): MascotFrame | null {
  const appear = at("approach", t);
  const leave = at("retract", t);
  if (appear <= 0 || leave >= 1) return null;

  const over = {
    x: t >= START.grip ? echo.x : ECHO.wrong.x,
    y: ECHO.wrong.y - LIFT * 0.5 * height,
  };

  let x = over.x;
  let y = over.y;

  if (appear < 1) {
    /* Appearing and travelling are one quadratic — it is already moving while
       it is still arriving, which is the difference between a descent and a
       fade followed by a descent. */
    const p = easeBoth(appear);
    const q = 1 - p;
    /* It lifts off the plate and comes down on the hole, rather than
       sliding across: a descent is what says *onto this one*. */
    const cx = lerp(ENTRY.x, over.x, 0.42);
    const cy = ENTRY.y - 210;
    x = q * q * ENTRY.x + 2 * q * p * cx + p * p * over.x;
    y = q * q * ENTRY.y + 2 * q * p * cy + p * p * over.y;
  }

  const dock = easeBack(at("dock", t));
  const fade = easeOut(clamp01(appear / 0.22));

  const TOP = -Math.PI / 2;
  const held = TOP + (START.dock / 1500) * Math.PI * 2;
  const next = TOP + Math.ceil((held - TOP) / (Math.PI * 2)) * Math.PI * 2;
  const spin =
    dock > 0
      ? lerp(held, next, easeOut(clamp01(dock)))
      : TOP + (t / 1500) * Math.PI * 2;

  return {
    x,
    y: y - (leave > 0 ? 14 * easeOut(leave) : 0),
    /* Clamped: the settle overshoots past 1, and on a 62-unit range that took
       the closed ring down below the size of the hole. */
    r: Math.max(9, lerp(72, 9, dock)) + 9 * easeOut(leave),
    dock,
    spin,
    opacity: fade * (1 - easeOut(leave)),
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
    TOTAL,
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
