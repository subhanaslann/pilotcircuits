/**
 * The agent, as something on the bench.
 *
 * Until now the agent's presence on the canvas was a ring drawn *around* a pin
 * and a camera that moved on its own. Both are consequences of a tool call and
 * neither is an actor: nothing on screen ever came from anywhere, did a thing
 * and left. So a person watching an agent work — which is the whole promise of
 * registering these tools with the browser — saw a build that changed by
 * itself, which is indistinguishable from a page with a bug in it.
 *
 * This is the actor. A hollow ring that arrives wide, closes onto the hole it
 * has come for, holds while the work lands, and retracts. It is the mascot the
 * entry screen's repair sequence was designed around, lifted out of that film
 * and made general: the sequence there is one hard-coded run over one frame,
 * and this is the same choreography as a function of a job and a clock.
 *
 * ## Three jobs, because the agent does three kinds of thing
 *
 *   `read`    it is looking. Wide, half-open, moving between the places it is
 *             comparing — `inspect_build`, `verify_current_step`.
 *   `point`   it is showing you one place. Closes onto it — `show_correction`.
 *   `carry`   it has hands, for once. Closes on a lead, travels, seats it —
 *             `attach_lead`, and nothing else in the product.
 *
 * ## Nothing here imports React, and nothing here knows what a circuit is
 *
 * Same rule as the rest of `lib/agent/`: the model is a function of a job and a
 * clock, and the store is four closures over them. Points arrive already in
 * scene units — resolving *which* node the agent is talking about is a question
 * about the build, and it is answered by the hook that watches the session
 * (`workbench/use-agent-mascot.ts`), not here.
 *
 * ## One bench at a time
 *
 * The store is a module singleton, like the entry screen's. That is sound for
 * exactly as long as two live benches are never on screen together — the
 * product's workbench and the design lab's are separate routes. If that ever
 * stops being true this becomes per-session state, and the hook is the seam
 * where it would change.
 */

export interface Point {
  x: number;
  y: number;
}

export type MascotJob =
  /** Looking at several places in turn. */
  | { kind: "read"; over: Point[] }
  /** Showing one place. */
  | { kind: "point"; at: Point }
  /**
   * Moving something.
   *
   * `from` is where the lead is now — absent when it is still in the kit, in
   * which case the ring arrives already carrying it rather than pretending to
   * pick it off a shelf that is not part of the drawing.
   */
  | { kind: "carry"; from: Point | null; to: Point };

/** One drawing of the ring. The layer renders this and nothing else. */
export interface Ring {
  x: number;
  y: number;
  r: number;
  /** 0 open and travelling, 1 closed on a hole. Drives the crosshair arms. */
  dock: number;
  /** Where the index dot sits on the circumference, in radians. */
  spin: number;
  opacity: number;
}

export interface MascotFrame {
  now: Ring;
  /**
   * Where the ring was a moment ago, fading.
   *
   * A single outline crossing a busy bench is a thing you can blink past.
   * Three ghosts behind it turn a position into a direction, which is what the
   * eye actually catches — and they cost nothing, being the same function of a
   * clock read three more times.
   */
  trail: Ring[];
}

/* --- The beats ------------------------------------------------------------
   Shorter than the entry screen's, and deliberately: that is a film somebody
   sat down to watch, this is feedback on a call somebody just made. Long
   enough to be followed, short enough that a person driving the bench through
   an agent is not waiting on an animation.                                  */

const BEAT = {
  enter: 320,
  close: 240,
  grip: 200,
  travel: 400,
  /** Per stop, when reading. */
  look: 260,
  hold: 400,
  leave: 260,
} as const;

/**
 * How far into a `carry` the lead actually moves.
 *
 * Exported because `attach_lead` waits exactly this long before it commits:
 * the part snaps into its hole on the frame the ring arrives, rather than
 * before the ring sets off or after it has gone. One clock, two readers — the
 * alternative is two constants that agree until somebody edits one.
 */
export const SEAT_AT = BEAT.enter + BEAT.close + BEAT.grip + BEAT.travel;

/** And when it takes hold, which is where the tool's two phases divide. */
export const GRIP_AT = BEAT.enter + BEAT.close + BEAT.grip;

/** How wide the ring is on the way in, and how tight it closes. */
const RING = { open: 62, looking: 26, closed: 9 } as const;

/** Where it comes from, relative to the first place it is going. */
const ENTRY = { dx: 230, dy: -180 } as const;

/** How high a carried lead rides over the bench on the way across. */
const LIFT = 16;

type Phase = "enter" | "close" | "grip" | "travel" | "look" | "hold" | "leave";

interface Segment {
  phase: Phase;
  start: number;
  end: number;
  /** Which stop a `look` is on. */
  stop?: number;
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeBoth = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
/** Overshoots and settles — the ring closes onto a hole rather than arriving. */
const easeBack = (p: number) =>
  1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);

/** Every place the job visits, in order. */
function stopsOf(job: MascotJob): Point[] {
  if (job.kind === "read") return job.over;
  if (job.kind === "point") return [job.at];
  return job.from ? [job.from, job.to] : [job.to];
}

function planOf(job: MascotJob): Segment[] {
  const plan: Segment[] = [];
  let t = 0;
  const add = (phase: Phase, ms: number, stop?: number) => {
    plan.push({ phase, start: t, end: t + ms, stop });
    t += ms;
  };

  add("enter", BEAT.enter);

  if (job.kind === "read") {
    job.over.forEach((_, index) => add("look", BEAT.look, index));
  } else if (job.kind === "point") {
    add("close", BEAT.close);
    add("hold", BEAT.hold);
  } else {
    add("close", BEAT.close);
    add("grip", BEAT.grip);
    add("travel", BEAT.travel);
    add("hold", BEAT.hold);
  }

  add("leave", BEAT.leave);
  return plan;
}

export function durationOf(job: MascotJob): number {
  const plan = planOf(job);
  return plan[plan.length - 1].end;
}

const TOP = -Math.PI / 2;
/** The index dot's free run: one turn every 1.4 seconds. */
const spinFree = (ms: number) => TOP + (ms / 1400) * Math.PI * 2;

/**
 * The ring at a moment, or `null` outside the run.
 *
 * Pure, and called four times per frame — once for the ring and three times
 * for its trail — so it holds no state and reads nothing but its arguments.
 */
export function frameAt(job: MascotJob, t: number): Ring | null {
  const plan = planOf(job);
  const total = plan[plan.length - 1].end;
  if (t <= 0 || t >= total) return null;

  const stops = stopsOf(job);
  const first = stops[0];
  const entry = { x: first.x + ENTRY.dx, y: first.y + ENTRY.dy };

  const seg = plan.find((s) => t < s.end) ?? plan[plan.length - 1];
  const p = clamp01((t - seg.start) / (seg.end - seg.start));

  /* Where the ring is, and how tight, per phase. Position and radius only —
     the dot and the fade are the same two rules for every phase and are
     worked out once, below. */
  let x = first.x;
  let y = first.y;
  let r: number = RING.closed;
  let dock = 1;

  switch (seg.phase) {
    case "enter": {
      /* Appearing and travelling are one quadratic: it is already moving while
         it is still arriving, which is the difference between a descent and a
         fade followed by a descent. It comes *down onto* the place it is
         going, rather than sliding across — a descent is what says
         **this one**. */
      const q = easeBoth(p);
      const back = 1 - q;
      const cx = lerp(entry.x, first.x, 0.42);
      const cy = entry.y - 150;
      x = back * back * entry.x + 2 * back * q * cx + q * q * first.x;
      y = back * back * entry.y + 2 * back * q * cy + q * q * first.y;
      r = job.kind === "read" ? lerp(RING.open, RING.looking, q) : RING.open;
      dock = 0;
      break;
    }
    case "look": {
      const index = seg.stop ?? 0;
      const from = index === 0 ? stops[0] : stops[index - 1];
      const to = stops[index];
      /* Moves for the first two thirds of its beat and rests for the last —
         a stop with no pause in it reads as drifting rather than as looking. */
      const q = easeBoth(clamp01(p / 0.66));
      x = lerp(from.x, to.x, q);
      y = lerp(from.y, to.y, q);
      r = RING.looking;
      dock = 0;
      break;
    }
    case "close": {
      dock = clamp01(easeBack(p));
      r = Math.max(RING.closed, lerp(RING.open, RING.closed, dock));
      break;
    }
    case "grip": {
      /* A squeeze. The one beat where the ring does something to the thing
         under it rather than to the view. */
      r = RING.closed * (1 + 0.4 * Math.sin(Math.PI * p));
      break;
    }
    case "travel": {
      const to = job.kind === "carry" ? job.to : first;
      const q = easeBoth(p);
      x = lerp(first.x, to.x, q);
      y = lerp(first.y, to.y, q) - LIFT * Math.sin(Math.PI * p);
      break;
    }
    case "hold": {
      const last = stops[stops.length - 1];
      x = job.kind === "carry" ? job.to.x : last.x;
      y = job.kind === "carry" ? job.to.y : last.y;
      break;
    }
    case "leave": {
      const last = job.kind === "carry" ? job.to : stops[stops.length - 1];
      x = last.x;
      y = last.y - 14 * easeOut(p);
      r = (job.kind === "read" ? RING.looking : RING.closed) + 12 * easeOut(p);
      dock = job.kind === "read" ? 0 : 1;
      break;
    }
  }

  /* The dot runs the circumference while the ring is open and parks at the top
     as it closes — the arms it turns into come out of where it stopped. */
  const closesAt = plan.find((s) => s.phase === "close")?.start ?? 0;
  const held = spinFree(closesAt);
  const next = TOP + Math.ceil((held - TOP) / (Math.PI * 2)) * Math.PI * 2;
  const spin = dock > 0 ? lerp(held, next, easeOut(dock)) : spinFree(t);

  const leaving = plan[plan.length - 1];
  const gone = t < leaving.start ? 0 : easeOut(clamp01((t - leaving.start) / BEAT.leave));

  return {
    x,
    y,
    r,
    dock,
    spin,
    opacity: easeOut(clamp01(t / (BEAT.enter * 0.3))) * (1 - gone),
  };
}

/* --- The store -----------------------------------------------------------
   Three closures over a job and a clock. The layer subscribes; nothing else
   in the product reads this, and nothing at all writes it except the hook
   that is watching the session.                                            */

let job: MascotJob | null = null;
let started = 0;
let now = 0;
let raf = 0;
let timer = 0;
const listeners = new Set<() => void>();

let cached: MascotFrame | null = null;
let cachedKey = "";

/** The ghosts, in milliseconds behind. */
const TRAIL = [80, 160, 240];

export function getFrame(): MascotFrame | null {
  if (!job) return null;
  const key = `${started}:${now}`;
  if (key === cachedKey) return cached;

  const ring = frameAt(job, now);
  cached = ring
    ? {
        now: ring,
        trail: TRAIL.map((back) => frameAt(job!, now - back)).filter(
          (g): g is Ring => g !== null,
        ),
      }
    : null;
  cachedKey = key;
  return cached;
}

/** Nothing, on the server and on the first client render. */
export function getServerFrame(): MascotFrame | null {
  return null;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit() {
  cachedKey = "";
  for (const fn of listeners) fn();
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  if (timer) clearTimeout(timer);
  raf = 0;
  timer = 0;
}

/**
 * Two ways of not being able to animate, one answer.
 *
 * Reduced motion is a preference; a hidden tab is a fact — the browser stops
 * `requestAnimationFrame` there, and a run left mid-flight would strand the
 * ring over a hole it never left. Either way the agent is still *shown* to
 * have been there: the ring stands closed on its target for the length of the
 * job and then goes. Removing it entirely would take the answer away from the
 * people most likely to need it.
 */
function blind(reduced: boolean) {
  return (
    reduced ||
    (typeof document !== "undefined" && document.visibilityState === "hidden")
  );
}

export function fly(next: MascotJob, reduced = false) {
  stop();
  job = next;
  started = Date.now();
  const total = durationOf(next);

  if (blind(reduced)) {
    /* Parked on the target, arms out, for as long as the job lasts. */
    now = total - BEAT.leave - 1;
    emit();
    timer = window.setTimeout(() => {
      timer = 0;
      land();
    }, total);
    return;
  }

  const t0 = performance.now();
  const step = (stamp: number) => {
    now = stamp - t0;
    if (now >= total) {
      raf = 0;
      land();
      return;
    }
    emit();
    raf = requestAnimationFrame(step);
  };
  now = 0;
  emit();
  raf = requestAnimationFrame(step);
}

/** The agent is not on the bench. Also what a route unmounting must call. */
export function land() {
  stop();
  job = null;
  now = 0;
  emit();
}

/** Whether the ring is on the bench right now. */
export function isFlying(): boolean {
  return job !== null;
}
