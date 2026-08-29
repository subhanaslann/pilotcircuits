"use client";

/**
 * F-07 · Motion tokens.
 *
 * Motion in this product is confirmation, never decoration: it tells you a tool
 * ran, a wire is the one being discussed, or a step just passed. Everything
 * lands between 150ms and 350ms, and nothing loops forever except the agent
 * activity pulse — which is deliberately faint.
 */

import { useSyncExternalStore } from "react";

export const duration = {
  /** Hover, focus, colour change. */
  instant: 0.15,
  /** Small enter/exit: tooltip, chip, badge. */
  quick: 0.22,
  /** Panel and content transitions, tab switches. */
  settle: 0.28,
  /** Canvas highlights, servo rotation preview, guidance arrow. */
  deliberate: 0.35,
} as const;

export const ease = {
  /** Default for anything entering or settling. */
  out: [0.16, 0.84, 0.44, 1],
  /** Symmetric moves: pan, dock open/close. */
  inOut: [0.4, 0, 0.2, 1],
  /** One small overshoot, used sparingly (success confirmation only). */
  overshoot: [0.34, 1.26, 0.64, 1],
} as const;

/** Shared enter/exit for cards appearing in the agent panel. */
export const fadeUp = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
  transition: { duration: duration.quick, ease: ease.out },
} as const;

/** Step-to-step content transition on the workbench. */
export const stepSwap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: duration.settle, ease: ease.out },
} as const;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Reads the user's motion preference and keeps it live — the OS setting can
 * change while the app is open. Every animated component gates on this and
 * falls back to an instant state change, never to a missing state.
 *
 * The server renders the full-motion branch; the CSS `prefers-reduced-motion`
 * block in `globals.css` already suppresses animation before hydration, so
 * there is no flash of movement.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** Collapses a duration to zero when the user asked for reduced motion. */
export function motionSafe(seconds: number, reduced: boolean): number {
  return reduced ? 0 : seconds;
}
