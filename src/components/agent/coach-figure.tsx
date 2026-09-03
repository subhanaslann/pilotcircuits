"use client";

import type { CSSProperties } from "react";
import type { CoachMood } from "@/lib/agent/coach";
import { cn } from "@/lib/utils/cn";

/**
 * G-16 · The coach, as a figure.
 *
 * A-22 said the agent's mark is *"deliberately not a face"*, and C-24 drew the
 * agent on the bench as a hollow ring with *"no body, no face, no callout"*.
 * Both still hold where they were made: the mark is a node in the panel
 * header and the ring is the agent's **position** on the bench. This is a
 * third thing, asked for by name — a figure a person who has never opened the
 * product reads as *the agent* in the first second, whose face changes with
 * the tool the browser is calling. The ring says *where*; the face says
 * *what*. Rule 6 is the reason it exists: eight of the twelve tools move
 * nothing on the bench, and a call that moves nothing has, to the person
 * watching, not happened.
 *
 * ## Round, and drawn from the product's own shapes
 *
 * The first draft had a cloud-shaped head and a dark rectangular screen for a
 * face with terminal glyphs on it, and it was thrown out: that silhouette
 * is another company's mascot, and a lookalike is a liability whatever the
 * intent. So there is no screen and no cloud anywhere in this file. The
 * three bodies kept for comparison in `/lab/agent#g-coach` all come from
 * things this product already draws:
 *
 *   `halo`  a ball with the bench ring floating over it — the ring from
 *           `agent-mascot.tsx`, index dot and crosshair arms included, so the
 *           figure is visibly the same agent that lands on a hole.
 *   `pad`   the ball *inside* the ring: a plated pad with a face, the motif
 *           of the activity spine and the pulse lattice. No arms — the ring's
 *           own arms come out when it points, exactly as they do on the mat.
 *   `lamp`  a 5 mm LED with eyes: the part chapter one is about, dome, flange
 *           and two legs of unequal length.
 *
 * The face is two eyes and a mouth, drawn as strokes: dots that scan when it
 * reads, three typing dots for a mouth when it weighs, chevrons when it moves,
 * `^ ^` and `x x` for the two verdicts. Every mood is also *said* beside the
 * figure by `CoachCorner`, in the reader's language, so no expression is ever
 * the only carrier of its meaning (rule 7).
 *
 * ## Motion is a class, not a keyframe
 *
 * Every animation is a `coach-*` utility from `globals.css`, so this file
 * calls an intention and writes no timing of its own. Rotations set their own
 * origin in view-box units (`transform-box: view-box`), which is what turns
 * an arm at its shoulder and the ring's dot around its centre rather than the
 * whole drawing around its corner.
 */

export const coachSilhouettes = ["halo", "pad", "lamp"] as const;

export type CoachSilhouette = (typeof coachSilhouettes)[number];

/** The one chosen from the three drafted in the lab. */
export const defaultSilhouette: CoachSilhouette = "lamp";

/**
 * The figure's own colours.
 *
 * The body is the agent's accent — the same blue as the ring, the pulse and
 * the primary action, because the figure is the agent and not a new thing.
 * The bench ring is that accent too now (`agent-mascot.tsx`: one agent, one
 * blue, and its halo is what carries legibility over the board); the small
 * ring drawn *over* the figure is lifted lighter only because it sits on the
 * body's own blue, and the face is white on the body the way the board's
 * silkscreen is white on the board.
 */
const INK = {
  body: "#1677FF",
  bodyEdge: "#0F5FD1",
  ring: "#8FBCFF",
  face: "#FFFFFF",
  glow: "#8FBCFF",
  shadow: "#000000",
} as const;

interface Point {
  x: number;
  y: number;
}

const pivot = (x: number, y: number): CSSProperties => ({
  transformBox: "view-box",
  transformOrigin: `${x}px ${y}px`,
});

/** A mood in which a call is in flight — the ring's dot runs while it lasts. */
const working = (mood: CoachMood) =>
  mood === "looking" ||
  mood === "thinking" ||
  mood === "touching" ||
  mood === "testing" ||
  mood === "moving";

/** The ring closes on its arms, as it does over a hole, when there is one place to show. */
const docked = (mood: CoachMood) => mood === "showing" || mood === "found";

export function CoachFigure({
  mood,
  silhouette = defaultSilhouette,
  /** Height in CSS pixels; the width follows the drawing's own ratio. */
  size = 56,
  className,
}: {
  mood: CoachMood;
  silhouette?: CoachSilhouette;
  size?: number;
  className?: string;
}) {
  const whole =
    mood === "idle"
      ? "coach-bob"
      : mood === "moving"
        ? "coach-lean"
        : mood === "passed"
          ? "coach-hop"
          : mood === "failed"
            ? "coach-slump"
            : mood === "thinking"
              ? "coach-tilt"
              : undefined;

  return (
    <svg
      viewBox="0 0 64 76"
      width={(size * 64) / 76}
      height={size}
      aria-hidden="true"
      data-mood={mood}
      data-silhouette={silhouette}
      className={cn(
        "shrink-0 overflow-visible",
        mood === "offline" && "opacity-55",
        className,
      )}
    >
      {/* The ground it stands on — the one thing that does not move with it,
          so a hop reads as leaving the floor. */}
      <ellipse
        cx={32}
        cy={72.5}
        rx={14}
        ry={2.4}
        fill={INK.shadow}
        opacity={0.28}
      />

      <g className={whole} style={pivot(32, 68)}>
        {silhouette === "halo" ? (
          <HaloBody mood={mood} />
        ) : silhouette === "pad" ? (
          <PadBody mood={mood} />
        ) : (
          <LampBody mood={mood} />
        )}
      </g>
    </svg>
  );
}

/* --- The three bodies ------------------------------------------------- */

const BALL: Point & { r: number } = { x: 32, y: 44, r: 19 };

function HaloBody({ mood }: { mood: CoachMood }) {
  return (
    <g>
      <Ring at={{ x: 32, y: 13.5 }} r={7.5} mood={mood} />
      <Feet />
      <Arms
        mood={mood}
        left={{ from: { x: 14, y: 49 }, to: { x: 7, y: 58 } }}
        right={{ from: { x: 50, y: 49 }, to: { x: 57, y: 58 } }}
      />
      <Ball />
      <Face at={{ x: 32, y: 42 }} mood={mood} />
    </g>
  );
}

function PadBody({ mood }: { mood: CoachMood }) {
  /* The ring is what a pad's annulus is: wider than the body, hollow, and the
     one part of this figure that does the pointing. While the agent works on
     the bench the body shifts under it — the pad has no hands to fiddle
     with, so the fiddling is the body's. */
  return (
    <g>
      <Ring at={{ x: BALL.x, y: BALL.y }} r={25} mood={mood} />
      <g className={cn(mood === "touching" && "coach-march")}>
        <Ball />
        <Face at={{ x: 32, y: 42 }} mood={mood} />
      </g>
    </g>
  );
}

/**
 * A 5 mm LED, the way `led-artwork.tsx` draws one and the illustration
 * appendix argues for it: taller than it is wide, a dome on a
 * straight-sided body, a flange, and one leg longer than the other — that is
 * how a real LED says which way round it goes, and the figure keeps the joke.
 */
function LampBody({ mood }: { mood: CoachMood }) {
  return (
    <g>
      {/* A blue LED lights blue. The glow is the run's own signal: it comes
          up while a test plays and stays off otherwise. */}
      {mood === "testing" ? (
        <circle
          cx={32}
          cy={30}
          r={21}
          fill={INK.glow}
          opacity={0.45}
          className="coach-flash"
        />
      ) : null}
      {/* Legs first, so the flange sits over them. The long one is the anode. */}
      <rect x={26.5} y={51} width={3.6} height={17} rx={1.8} fill={INK.bodyEdge} />
      <rect x={34} y={51} width={3.6} height={12} rx={1.8} fill={INK.bodyEdge} />
      <Arms
        mood={mood}
        left={{ from: { x: 17, y: 40 }, to: { x: 9, y: 49 } }}
        right={{ from: { x: 47, y: 40 }, to: { x: 55, y: 49 } }}
      />
      <path
        d="M 16 46 V 30 A 16 16 0 0 1 48 30 V 46 Z"
        fill={INK.body}
        stroke={INK.bodyEdge}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <rect x={13.5} y={45} width={37} height={5.5} rx={2} fill={INK.body} stroke={INK.bodyEdge} strokeWidth={1.5} />
      <Highlight at={{ x: 24, y: 22 }} />
      <Face at={{ x: 32, y: 34 }} mood={mood} />
    </g>
  );
}

/* --- Shared parts --------------------------------------------------------- */

function Ball() {
  return (
    <g>
      <circle cx={BALL.x} cy={BALL.y} r={BALL.r} fill={INK.body} stroke={INK.bodyEdge} strokeWidth={1.5} />
      <Highlight at={{ x: 25, y: 33 }} />
    </g>
  );
}

/** One soft catch of light, top left — what makes a disc a ball. */
function Highlight({ at }: { at: Point }) {
  return (
    <ellipse
      cx={at.x}
      cy={at.y}
      rx={5.5}
      ry={3.4}
      fill={INK.face}
      opacity={0.2}
      transform={`rotate(-28 ${at.x} ${at.y})`}
    />
  );
}

function Feet() {
  return (
    <g>
      <circle cx={24.5} cy={64.5} r={4.6} fill={INK.body} stroke={INK.bodyEdge} strokeWidth={1.5} />
      <circle cx={39.5} cy={64.5} r={4.6} fill={INK.body} stroke={INK.bodyEdge} strokeWidth={1.5} />
    </g>
  );
}

/**
 * The bench ring, at figure scale: hollow, an index dot on the circumference
 * that runs while the agent works, and the four crosshair arms it turns into
 * when it has one place to show — the same three states `MascotRing` draws
 * on the mat, so the halo over the figure and the ring on the hole are one
 * object seen twice.
 */
function Ring({ at, r, mood }: { at: Point; r: number; mood: CoachMood }) {
  const arms = docked(mood);
  const run = working(mood);

  return (
    <g
      className={cn(arms && "coach-dock")}
      style={pivot(at.x, at.y)}
      opacity={mood === "offline" ? 0.4 : 1}
    >
      <circle cx={at.x} cy={at.y} r={r} fill="none" stroke={INK.ring} strokeWidth={2.2} />

      {arms
        ? [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
          ].map(([ux, uy]) => (
            <line
              key={`${ux}-${uy}`}
              x1={at.x + ux * (r + 1.5)}
              y1={at.y + uy * (r + 1.5)}
              x2={at.x + ux * (r + 5)}
              y2={at.y + uy * (r + 5)}
              stroke={INK.ring}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          ))
        : mood === "offline" ? null : (
            <g
              className={cn(
                run && (mood === "testing" ? "coach-orbit-fast" : "coach-orbit"),
              )}
              style={pivot(at.x, at.y)}
            >
              <circle cx={at.x} cy={at.y - r} r={2.2} fill={INK.ring} />
            </g>
          )}
    </g>
  );
}

function Arms({
  mood,
  left,
  right,
}: {
  mood: CoachMood;
  left: { from: Point; to: Point };
  right: { from: Point; to: Point };
}) {
  const fiddling = mood === "touching";
  const pointing = mood === "showing";

  return (
    <g>
      {/* Left arm — the one that points, because the figure stands at the
          bench's top right and the board is down and to its left. */}
      <g
        className={cn(pointing && "coach-point", fiddling && "coach-hands")}
        style={pivot(left.from.x, left.from.y)}
      >
        <Arm from={left.from} to={left.to} />
      </g>
      <g
        className={cn(fiddling && "coach-hands")}
        style={{
          ...pivot(right.from.x, right.from.y),
          animationDelay: fiddling ? "250ms" : undefined,
        }}
      >
        <Arm from={right.from} to={right.to} />
      </g>
    </g>
  );
}

function Arm({ from, to }: { from: Point; to: Point }) {
  return (
    <g>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={INK.bodyEdge} strokeWidth={6.5} strokeLinecap="round" />
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={INK.body} strokeWidth={4} strokeLinecap="round" />
      <circle cx={to.x} cy={to.y} r={3.2} fill={INK.body} stroke={INK.bodyEdge} strokeWidth={1.5} />
    </g>
  );
}

/* --- The face ------------------------------------------------------------- */

const EYE_DX = 7;
const EYE_DY = -3;
const MOUTH_DY = 5;

/**
 * Two eyes and a mouth, per mood — strokes, not glyphs, because at 56px a
 * drawn `x` is an `x` and a typeset one is a smudge.
 */
function Face({ at, mood }: { at: Point; mood: CoachMood }) {
  const left = { x: at.x - EYE_DX, y: at.y + EYE_DY };
  const right = { x: at.x + EYE_DX, y: at.y + EYE_DY };
  const mouth = { x: at.x, y: at.y + MOUTH_DY };
  const stroke = {
    stroke: INK.face,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  const eyes = (() => {
    switch (mood) {
      case "offline":
        return (
          <g opacity={0.7}>
            <Closed at={left} />
            <Closed at={right} />
          </g>
        );
      case "idle":
        return (
          <g className="coach-blink" style={pivot(at.x, left.y)}>
            <Dot at={left} r={2.8} />
            <Dot at={right} r={2.8} />
          </g>
        );
      case "looking":
        return (
          <g className="coach-scan">
            <Dot at={left} r={2.8} />
            <Dot at={right} r={2.8} />
          </g>
        );
      case "thinking":
        /* Up and to the side, the way anybody's go while they weigh something. */
        return (
          <g transform="translate(2 -2.5)">
            <Dot at={left} r={2.6} />
            <Dot at={right} r={2.6} />
          </g>
        );
      case "touching":
        return (
          <g>
            <Dot at={left} r={2} />
            <Dot at={right} r={2} />
          </g>
        );
      case "testing":
      case "showing":
      case "found":
        return (
          <g>
            <Dot at={left} r={3.2} />
            <Dot at={right} r={3.2} />
          </g>
        );
      case "moving":
        return (
          <g className="coach-march">
            <Chevron at={left} />
            <Chevron at={right} />
          </g>
        );
      case "passed":
        return (
          <g>
            <Happy at={left} />
            <Happy at={right} />
          </g>
        );
      case "failed":
        return (
          <g>
            <Crossed at={left} />
            <Crossed at={right} />
          </g>
        );
    }
  })();

  const mouthShape = (() => {
    switch (mood) {
      case "thinking":
        return (
          <g>
            {[-4, 0, 4].map((dx, index) => (
              <circle
                key={dx}
                cx={mouth.x + dx}
                cy={mouth.y + 1}
                r={1.3}
                fill={INK.face}
                className="coach-typing"
                style={{ animationDelay: `${index * 200}ms` }}
              />
            ))}
          </g>
        );
      case "testing":
        return <circle cx={mouth.x} cy={mouth.y + 1.5} r={2} {...stroke} strokeWidth={2} />;
      case "passed":
        return <path d={`M ${mouth.x - 5} ${mouth.y} Q ${mouth.x} ${mouth.y + 6} ${mouth.x + 5} ${mouth.y}`} {...stroke} />;
      case "failed":
        return <path d={`M ${mouth.x - 4} ${mouth.y + 3} Q ${mouth.x} ${mouth.y - 1} ${mouth.x + 4} ${mouth.y + 3}`} {...stroke} />;
      case "looking":
      case "touching":
      case "offline":
        return <line x1={mouth.x - 3} y1={mouth.y + 1.5} x2={mouth.x + 3} y2={mouth.y + 1.5} {...stroke} />;
      default:
        return <path d={`M ${mouth.x - 3.5} ${mouth.y} Q ${mouth.x} ${mouth.y + 3.5} ${mouth.x + 3.5} ${mouth.y}`} {...stroke} />;
    }
  })();

  return (
    <g>
      {eyes}
      {mouthShape}
    </g>
  );
}

function Dot({ at, r }: { at: Point; r: number }) {
  return <circle cx={at.x} cy={at.y} r={r} fill={INK.face} />;
}

function Closed({ at }: { at: Point }) {
  return (
    <line x1={at.x - 2.8} y1={at.y} x2={at.x + 2.8} y2={at.y} stroke={INK.face} strokeWidth={2.2} strokeLinecap="round" />
  );
}

function Chevron({ at }: { at: Point }) {
  return (
    <polyline
      points={`${at.x - 2},${at.y - 3} ${at.x + 1.5},${at.y} ${at.x - 2},${at.y + 3}`}
      fill="none"
      stroke={INK.face}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Happy({ at }: { at: Point }) {
  return (
    <path
      d={`M ${at.x - 3.2} ${at.y + 1.5} Q ${at.x} ${at.y - 3} ${at.x + 3.2} ${at.y + 1.5}`}
      fill="none"
      stroke={INK.face}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  );
}

function Crossed({ at }: { at: Point }) {
  return (
    <g stroke={INK.face} strokeWidth={2.2} strokeLinecap="round">
      <line x1={at.x - 2.5} y1={at.y - 2.5} x2={at.x + 2.5} y2={at.y + 2.5} />
      <line x1={at.x - 2.5} y1={at.y + 2.5} x2={at.x + 2.5} y2={at.y - 2.5} />
    </g>
  );
}
