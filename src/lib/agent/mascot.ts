import type { PartId } from "@/lib/circuit/placement";
import type { KitId } from "@/lib/projects/catalog";

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
 * ## One agent: the ring leaves the lamp and comes back to it
 *
 * The coach figure on the shelf and this ring were filmed as two things: the
 * ring materialised at a fixed offset from its first stop — which at the
 * opening fit is behind the kit shelf, so it appeared as a clipped arc — and
 * vanished in place. A job started while another was flying restarted from
 * that offset, which is a teleport. `fly` takes options now: where the ring
 * enters from (`entry`, the lamp), where it goes when it is done (`home`, the
 * lamp again), and when a job arrives mid-flight the store starts it from the
 * last ring the layer drew — position, radius, no fade-in — so the agent is
 * one body that changes its mind, not two that swap.
 *
 * ## Anchors, not points, and pixels, not scene units
 *
 * Jobs name anchors: a place on the bench in scene units, or a place on the
 * screen — a shelf tile, the coach figure — in CSS pixels of the canvas well.
 * `frameAt` resolves every one of them through the caller's resolver on every
 * frame, so a scene anchor follows a camera that is still focusing while the
 * ring is on its way. The ring itself is drawn in a screen-space layer, so
 * its radii and strokes are CSS pixels by construction: measured at 290% the
 * old scene-unit ring was 75 px across with a 9 px stroke and covered the
 * very LED it had come to look at.
 *
 * ## Nothing here imports React, and nothing here knows what a circuit is
 *
 * Same rule as the rest of `lib/agent/`: the model is a function of a job and a
 * clock, and the store is a few closures over them. Resolving *which* node the
 * agent is talking about is a question about the build, and it is answered by
 * the hook that watches the session (`workbench/use-agent-mascot.ts`), not
 * here. The two type imports above are names, not knowledge: a carry says
 * which shelf drawing rides in the ring, in the catalogue's own vocabulary.
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

/**
 * Where a job is anchored.
 *
 * `scene` is a place on the bench and moves with the camera; `screen` is a
 * place in the canvas well — a shelf tile, the last ring drawn — and does
 * not. `coach` is the coach figure, wherever it stands on *this* frame: its
 * caption changes width while a call runs and takes the figure with it, so a
 * position measured once was 77 px stale by the time the ring left, and the
 * ring was filmed departing from the words beside the lamp rather than from
 * the lamp. All three are CSS pixels by the time the ring is drawn; the layer
 * decides how.
 */
export type Anchor =
  | { kind: "scene"; x: number; y: number }
  | { kind: "screen"; x: number; y: number }
  | { kind: "coach" };

/** An anchor, in CSS pixels relative to the layer's top-left. Asked per frame. */
export type Resolve = (anchor: Anchor) => Point;

/**
 * The part riding in the ring, when a carry starts on the kit shelf.
 *
 * Since chapter two the shelf is on the canvas, so a lead that is still in the
 * box has a tile the ring can close on. The layer draws the part's own shelf
 * art inside the ring from the moment it takes hold until the seat lands and
 * the bench draws the seated part — the same gesture a person makes, seen
 * from the outside.
 */
export interface Carrying {
  part: PartId;
  component: KitId;
  /** Where the anchor lead is on the drawing, in the part's box. Rides at the ring's centre. */
  mark?: { x: number; y: number; label?: string };
  /** Keeps this copy's SVG ids off the tile's and the person's own drag. */
  uid: string;
}

export type MascotJob =
  /** Looking at several places in turn. */
  | { kind: "read"; over: Anchor[] }
  /** Showing one place. */
  | { kind: "point"; at: Anchor }
  /**
   * Moving something.
   *
   * `from` is where the lead is now: a scene anchor when it stands on the
   * bench, a screen anchor on its shelf tile when it is still in the kit, and
   * `null` when nothing on screen can be pointed at — then the ring arrives
   * already carrying, rather than pretending to pick it off a shelf that is
   * not part of the drawing.
   */
  | { kind: "carry"; from: Anchor | null; to: Anchor; carrying?: Carrying };

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

/**
 * How a flight is shaped, beyond the job itself.
 *
 * All optional, and all defaults are the ring as it was first filmed. The hook
 * fills them in from the bench — the lamp as `entry` and `home` — and the
 * store overrides four of them for continuity when a job arrives mid-flight.
 */
export interface FlightOptions {
  /** Where the ring comes from. Default: the first stop, offset by `ENTRY`. */
  entry?: Anchor;
  /**
   * How high the way in bows, in pixels: the entry curve's control point sits
   * this far above the entry. 150 is the original descent from off-screen; a
   * departure from the lamp wants about 40, and a continuation about 30 —
   * the ring is already on the bench, and a loop up would read as leaving.
   */
  arc?: number;
  /** The radius it starts at. Default `RING.open`; a continuation keeps its last. */
  open?: number;
  /** Whether it fades in. `false` for a continuation, which is already visible. */
  fadeIn?: boolean;
  /**
   * Where the ring goes when the job is done. Set, the leave phase travels
   * back there over `BEAT.home` while fading, instead of rising and fading
   * in place. `null` and absent both mean there is nowhere to go back to.
   */
  home?: Anchor | null;
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
  /** The leave, when it is a return to the lamp: a journey, not a fade. */
  home: 420,
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

/**
 * When the ring is first closed on what it came for — the start of the grip.
 *
 * A carried part rides in the ring from here to `SEAT_AT`, and its shelf tile
 * fades for the same span: the ring has hold of the drawing, so the drawing
 * moves to the ring.
 */
export const CARRY_FROM = BEAT.enter + BEAT.close;

/** How wide the ring is on the way in, and how tight it closes. */
const RING = { open: 62, looking: 26, closed: 9 } as const;

/** Where it comes from when nothing says otherwise, relative to the first stop. */
const ENTRY = { dx: 230, dy: -180 } as const;

/** How high a carried lead rides over the bench on the way across. */
const LIFT = 16;

/** The bow of the way in when nothing says otherwise: a descent from off-screen. */
const ARC = 150;

/** What a continuation bows by: it is already here, and must not read as leaving. */
const CONTINUE_ARC = 30;

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
const easeIn = (p: number) => p * p * p;
const easeBoth = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
/** Overshoots and settles — the ring closes onto a hole rather than arriving. */
const easeBack = (p: number) =>
  1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);

/** Every place the job visits, in order. */
function stopsOf(job: MascotJob): Anchor[] {
  if (job.kind === "read") return job.over;
  if (job.kind === "point") return [job.at];
  return job.from ? [job.from, job.to] : [job.to];
}

function planOf(job: MascotJob, opts: FlightOptions): Segment[] {
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

  add("leave", opts.home ? BEAT.home : BEAT.leave);
  return plan;
}

export function durationOf(job: MascotJob, opts: FlightOptions = {}): number {
  const plan = planOf(job, opts);
  return plan[plan.length - 1].end;
}

/**
 * How far across the bench a carried part is at `t`, on the ring's own curve.
 *
 * The layer scales the riding drawing from shelf size to bench size along the
 * travel, and it has to use the easing the ring's position uses or the part
 * would grow at a different rate than it moves.
 */
export function carryProgress(t: number): number {
  return easeBoth(clamp01((t - GRIP_AT) / BEAT.travel));
}

const TOP = -Math.PI / 2;
/** The index dot's free run: one turn every 1.4 seconds. */
const spinFree = (ms: number) => TOP + (ms / 1400) * Math.PI * 2;

/**
 * The ring at a moment, or `null` outside the run.
 *
 * Pure, and called four times per frame — once for the ring and three times
 * for its trail — so it holds no state and reads nothing but its arguments.
 * Every anchor goes through `resolve` here and now: the answer for a scene
 * anchor changes while the camera moves, and the ring has to land on where
 * the hole is on *this* frame.
 */
export function frameAt(
  job: MascotJob,
  t: number,
  opts: FlightOptions,
  resolve: Resolve,
): Ring | null {
  const plan = planOf(job, opts);
  const total = plan[plan.length - 1].end;
  if (t <= 0 || t >= total) return null;

  const stops = stopsOf(job).map(resolve);
  const first = stops[0];
  const entry = opts.entry
    ? resolve(opts.entry)
    : { x: first.x + ENTRY.dx, y: first.y + ENTRY.dy };
  const arc = opts.arc ?? ARC;
  const open = opts.open ?? RING.open;
  const home = opts.home ? resolve(opts.home) : null;

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
         **this one**. How far down is `arc`: from off-screen a long one, from
         the lamp a short one, and a continuation barely bows at all. */
      const q = easeBoth(p);
      const back = 1 - q;
      const cx = lerp(entry.x, first.x, 0.42);
      const cy = entry.y - arc;
      x = back * back * entry.x + 2 * back * q * cx + q * q * first.x;
      y = back * back * entry.y + 2 * back * q * cy + q * q * first.y;
      r = job.kind === "read" ? lerp(open, RING.looking, q) : open;
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
      r = Math.max(RING.closed, lerp(open, RING.closed, dock));
      break;
    }
    case "grip": {
      /* A squeeze. The one beat where the ring does something to the thing
         under it rather than to the view. */
      r = RING.closed * (1 + 0.4 * Math.sin(Math.PI * p));
      break;
    }
    case "travel": {
      const to = stops[stops.length - 1];
      const q = easeBoth(p);
      x = lerp(first.x, to.x, q);
      y = lerp(first.y, to.y, q) - LIFT * Math.sin(Math.PI * p);
      break;
    }
    case "hold": {
      const last = stops[stops.length - 1];
      x = last.x;
      y = last.y;
      break;
    }
    case "leave": {
      const last = stops[stops.length - 1];
      const reading = job.kind === "read";
      if (home) {
        /* Back to the lamp: an ease-in, so it lingers on the hole and then
           goes, lifting a little on the way as a hand does. It opens as it
           lets go. A read keeps its looking radius and never had arms to
           retract — the mock this was ported from only sent closed rings
           home, and a read that snapped to the closed radius on the way out
           was the one seam in it. */
        const q = easeIn(p);
        x = lerp(last.x, home.x, q);
        y = lerp(last.y, home.y, q) - 30 * Math.sin(Math.PI * p);
        r = (reading ? RING.looking : RING.closed) + 8 * p;
        dock = reading ? 0 : 1 - p;
      } else {
        x = last.x;
        y = last.y - 14 * easeOut(p);
        r = (reading ? RING.looking : RING.closed) + 12 * easeOut(p);
        dock = reading ? 0 : 1;
      }
      break;
    }
  }

  /* The dot runs the circumference while the ring is open and parks at the top
     as it closes — the arms it turns into come out of where it stopped. */
  const closesAt = plan.find((s) => s.phase === "close")?.start ?? 0;
  const held = spinFree(closesAt);
  const next = TOP + Math.ceil((held - TOP) / (Math.PI * 2)) * Math.PI * 2;
  const spin = dock > 0 ? lerp(held, next, easeOut(dock)) : spinFree(t);

  /* The fade out follows the leave: in place it goes early and settles; on
     the way home it stays visible for most of the journey and is gone as it
     reaches the lamp, which is what makes the lamp read as where it went. */
  const leaving = plan[plan.length - 1];
  const pp =
    t < leaving.start
      ? 0
      : clamp01((t - leaving.start) / (leaving.end - leaving.start));
  const gone = home ? easeIn(pp) : easeOut(pp);
  const fade =
    opts.fadeIn === false ? 1 : easeOut(clamp01(t / (BEAT.enter * 0.3)));

  return { x, y, r, dock, spin, opacity: fade * (1 - gone) };
}

/** The ghosts, in milliseconds behind. */
const TRAIL = [80, 160, 240];

/** The ring and its trail at a moment — `frameAt`, read four times. */
export function framesAt(
  job: MascotJob,
  t: number,
  opts: FlightOptions,
  resolve: Resolve,
): MascotFrame | null {
  const ring = frameAt(job, t, opts, resolve);
  if (!ring) return null;
  return {
    now: ring,
    trail: TRAIL.map((back) => frameAt(job, t - back, opts, resolve)).filter(
      (g): g is Ring => g !== null,
    ),
  };
}

/**
 * The options a job gets when it arrives while another is still flying.
 *
 * It starts where the last drawn ring was, at the radius it had, already
 * visible, and barely bows on its way to the new first stop. Everything the
 * caller asked for — the lamp as home, above all — is kept.
 */
export function continueFrom(last: Ring, wanted: FlightOptions): FlightOptions {
  return {
    ...wanted,
    entry: { kind: "screen", x: last.x, y: last.y },
    open: last.r,
    fadeIn: false,
    arc: CONTINUE_ARC,
  };
}

/* --- The store -----------------------------------------------------------
   A few closures over a job, its options and a clock. The layer subscribes;
   the kit shelf asks one yes-or-no question of it; nothing else in the
   product reads this, and nothing at all writes it except the hook that is
   watching the session and the layer reporting what it drew.               */

/**
 * What the layer draws from. A fresh object per emit and the same object in
 * between, which is what `useSyncExternalStore` needs from a snapshot.
 */
export interface MascotTick {
  job: MascotJob;
  opts: FlightOptions;
  now: number;
}

let job: MascotJob | null = null;
let opts: FlightOptions = {};
let now = 0;
let raf = 0;
let timer = 0;
let tick: MascotTick | null = null;
const listeners = new Set<() => void>();

/**
 * The last main ring the primary layer drew, in its own pixels.
 *
 * A plain field, written by the layer after it paints and read by `fly` when
 * a job arrives mid-flight. Not part of the tick: it is a fact about the last
 * paint, not something to render from.
 */
let drawn: Ring | null = null;

export function getTick(): MascotTick | null {
  return tick;
}

/** Nothing, on the server and on the first client render. */
export function getServerTick(): MascotTick | null {
  return null;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit() {
  tick = job ? { job, opts, now } : null;
  for (const fn of listeners) fn();
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  if (timer) clearTimeout(timer);
  raf = 0;
  timer = 0;
}

/** The primary layer, saying where it last put the ring. */
export function reportDrawn(ring: Ring | null) {
  drawn = ring;
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

export function fly(
  next: MascotJob,
  wanted: FlightOptions = {},
  reduced = false,
) {
  /* Mid-flight, the new job picks up from the ring as it was last painted.
     Decided before the old job is stopped, because the report is only
     meaningful about a job that is still there. */
  const shaped = job !== null && drawn !== null ? continueFrom(drawn, wanted) : wanted;
  stop();
  job = next;
  opts = shaped;
  const plan = planOf(next, shaped);
  const total = plan[plan.length - 1].end;

  if (blind(reduced)) {
    /* Parked on the target, arms out, for as long as the job lasts: the last
       frame before the leave, whichever kind of leave it is. */
    const leaving = plan[plan.length - 1];
    now = leaving.start - 1;
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
  opts = {};
  now = 0;
  drawn = null;
  emit();
}

/** Whether the ring is on the bench right now. */
export function isFlying(): boolean {
  return job !== null;
}

/**
 * The part the ring has hold of right now, or `null`.
 *
 * A primitive rather than an object, so the shelf can subscribe to it and be
 * re-rendered twice per carry — when the grip takes and when the job ends —
 * rather than sixty times a second.
 */
export function carryingPart(): PartId | null {
  if (!job || job.kind !== "carry" || !job.carrying) return null;
  return now >= CARRY_FROM ? job.carrying.part : null;
}
