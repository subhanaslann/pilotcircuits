"use client";

import { useEffect, useRef, useState } from "react";
import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode, NodeId } from "@/lib/circuit/graph";

/**
 * Which lead of this part am I moving?
 *
 * ## The question that was never asked
 *
 * A part is placed one lead at a time, and until now the bench decided *which*
 * lead on the person's behalf. Pressing an LED anywhere on its body committed
 * `anchorOf` — the short leg — because that is the lead the geometry is written
 * around; the two lead handles were the only way to say otherwise, and they are
 * two 8-unit rings one pitch apart on a part whose dome is four pitches wide.
 * So "I want to move the long leg" was a gesture you had to already know about,
 * aimed at a target the size of the thing it is attached to.
 *
 * Now a click on the part asks. Both of its leads are offered, you say which
 * one, and only then does the seat picker ask where it goes. Two questions, in
 * the order a person actually answers them.
 *
 * ## Why the marks are not on the leads
 *
 * They are, but only as dots. A seated LED's two legs are 10.4 scene units
 * apart, so two marks big enough to carry `−` and `+` would overlap by half
 * their width and paint order would decide which one a press landed on — the
 * exact failure `hitRadius` exists to prevent one layer down.
 *
 * So this borrows `pin-rings.tsx`'s answer to the same problem: **the mark on
 * the thing stays tiny and the words move out**, to a badge either side of the
 * part with a leader line back to the lead it names. The badge is the control —
 * a 24-unit target with air around it — and the dot is the annotation.
 *
 * ## And the badge says which, without colour
 *
 * `−` and `+` are what the part itself prints, so the badge prints them too
 * (rule 7: never colour alone). Where a part makes no distinction — a 220Ω
 * resistor's two ends are one piece of wire, which is why `INTERCHANGEABLE`
 * exists — there is no glyph to print and the leader line does the telling.
 * Inventing `A` and `B` for them would be the interface asserting a difference
 * the component does not have.
 */
export function LeadPicker({
  leads,
  aimAt,
  glyphFor,
  nameFor,
  onPick,
  onCancel,
}: {
  /** The part's leads, as the scene draws them. Two, on this build. */
  leads: CircuitNode[];
  /** Where a lead offers itself — `grabPoint`, the same point the drag aims. */
  aimAt: (lead: CircuitNode) => { x: number; y: number };
  /** `−`, `+`, or nothing where the part's two ends are the same thing. */
  glyphFor: (lead: NodeId) => string | undefined;
  /** `Move the LED's long leg` — the accessible name of one badge. */
  nameFor: (lead: NodeId) => string;
  onPick: (lead: NodeId) => void;
  onCancel: () => void;
}) {
  const [activeId, setActiveId] = useState<NodeId | undefined>(leads[0]?.id);
  const at = leads.findIndex((lead) => lead.id === activeId);
  const active = at === -1 ? 0 : at;

  const refs = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    refs.current.length = leads.length;
  }, [leads]);
  useEffect(() => {
    refs.current[active]?.focus();
  }, [active]);

  const move = (to: number) =>
    setActiveId(leads[(to + leads.length) % leads.length]?.id);

  /**
   * Where the press started, so a press that travelled cannot also commit.
   *
   * The same guard `seat-picker.tsx` carries, for the same reason and with one
   * difference: this one also **keeps the press to itself**. The viewport pans
   * on any press that reaches it, and these badges are drawn in the panning
   * layer — so pressing one dragged the whole bench four pixels sideways under
   * the hand that was trying to click it, and on a touch device that is a pan
   * gesture, which swallows the click outright.
   *
   * A badge is a button floating over the bench, not a piece of it. Nothing is
   * lost by withholding the press: the bench is pannable everywhere else, and
   * the answer to this question is two taps away in any case.
   */
  const press = useRef<{ id: NodeId; x: number; y: number } | null>(null);
  const PRESS_SLOP = 6;

  const commit = (id: NodeId, event: React.MouseEvent) => {
    const from = press.current;
    press.current = null;
    /* No press at all is an activation from the accessibility tree. */
    if (
      from &&
      (from.id !== id ||
        Math.hypot(event.clientX - from.x, event.clientY - from.y) >
          PRESS_SLOP)
    ) {
      return;
    }
    onPick(id);
  };

  /* Laid out left to right, so the badge on the left names the lead on the
     left. Read in `scene.nodes` order they would cross over each other, and a
     leader line that crosses its neighbour's is worse than no line at all. */
  const placed = leads
    .map((lead) => ({ lead, at: aimAt(lead) }))
    .sort((a, b) => a.at.x - b.at.x);

  const top = Math.min(...placed.map((p) => p.at.y)) - PITCH * 3.6;
  const left = Math.min(...placed.map((p) => p.at.x));
  const right = Math.max(...placed.map((p) => p.at.x));

  const BADGE = PITCH * 2.4;
  /* Far enough apart that the two targets never touch, whatever the zoom: the
     leads themselves are one pitch apart and these are 24 units of badge on
     46 units of centres. */
  const SPREAD = PITCH * 1.9;

  return (
    <g>
      {placed.map(({ lead, at: point }, index) => {
        const bx =
          placed.length < 2
            ? point.x
            : index === 0
              ? left - SPREAD
              : right + SPREAD;
        const glyph = glyphFor(lead.id);
        return (
          <g
            key={lead.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="button"
            tabIndex={index === active ? 0 : -1}
            aria-label={nameFor(lead.id)}
            className="group cursor-pointer outline-none"
            onPointerDown={(event) => {
              /* The bench stays put: see `press`. */
              event.stopPropagation();
              press.current = {
                id: lead.id,
                x: event.clientX,
                y: event.clientY,
              };
            }}
            onClick={(event) => commit(lead.id, event)}
            onFocus={() => setActiveId(lead.id)}
            onKeyDown={(event) => {
              const keys: Record<string, () => void> = {
                ArrowRight: () => move(index + 1),
                ArrowDown: () => move(index + 1),
                ArrowLeft: () => move(index - 1),
                ArrowUp: () => move(index - 1),
                Home: () => move(0),
                End: () => move(leads.length - 1),
                Enter: () => onPick(lead.id),
                " ": () => onPick(lead.id),
                Escape: onCancel,
              };
              const handler = keys[event.key];
              if (!handler) return;
              event.preventDefault();
              event.stopPropagation();
              handler();
            }}
          >
            {/* The leader line, drawn first so both marks sit on top of it. */}
            <line
              x1={bx}
              y1={top + BADGE / 2}
              x2={point.x}
              y2={point.y}
              stroke="var(--color-accent)"
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.75}
            />
            {/* The annotation on the lead itself: small, because its neighbour
                is one pitch away. */}
            <circle
              cx={point.x}
              cy={point.y}
              r={PITCH * 0.3}
              fill="var(--color-accent)"
            />
            {/* The control. Everything above is a picture of where it points. */}
            <rect
              x={bx - BADGE / 2}
              y={top - BADGE / 2}
              width={BADGE}
              height={BADGE}
              rx={PITCH * 0.7}
              fill="var(--color-accent)"
              className="group-focus-visible:[stroke-width:2.6] group-hover:[stroke-width:2.6]"
              stroke="#FFFFFF"
              strokeWidth={0}
            />
            {glyph ? (
              <text
                x={bx}
                y={top}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={PITCH * 1.6}
                fontWeight={700}
                fill="#FFFFFF"
              >
                {glyph}
              </text>
            ) : (
              /* No glyph to print: the part's two ends are the same thing. The
                 leader line is what tells them apart, so the badge only has to
                 look like a button. */
              <circle cx={bx} cy={top} r={PITCH * 0.34} fill="#FFFFFF" />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * The lead that is in your hand right now, marked on the part.
 *
 * A drag moves the whole part — a leg is a fixed-length path inside the
 * artwork and cannot bend — so while a resistor is travelling, both of its
 * ends are travelling and nothing on screen said which of them the release was
 * going to commit. Same disc as the picker's badge, so "this is the one" looks
 * the same wherever it is being said.
 */
export function CarriedLeadMark({
  at,
  glyph,
}: {
  at: { x: number; y: number };
  glyph?: string;
}) {
  return (
    <g style={{ pointerEvents: "none" }}>
      <circle
        cx={at.x}
        cy={at.y}
        r={PITCH * 0.56}
        fill="var(--color-accent)"
        stroke="#FFFFFF"
        strokeWidth={1.2}
      />
      {glyph ? (
        <text
          x={at.x}
          y={at.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={PITCH * 0.82}
          fontWeight={700}
          fill="#FFFFFF"
        >
          {glyph}
        </text>
      ) : null}
    </g>
  );
}
