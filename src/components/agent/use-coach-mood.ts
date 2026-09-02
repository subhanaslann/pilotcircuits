"use client";

import { useEffect, useState } from "react";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { useCopy } from "@/content/copy-provider";
import type { ToolCall } from "@/lib/agent/activity";
import {
  coachMood,
  dwellLeft,
  reactionFor,
  REACTION_MS,
  type CoachMood,
  type CoachReaction,
} from "@/lib/agent/coach";
import { say, type Line } from "@/lib/agent/line";
import type { AgentTool } from "@/lib/agent/model";

/**
 * The coach's mood, and the two lines printed beside it.
 *
 * Same discipline as `use-agent-mascot.ts`: it watches the **session**, never
 * a button, so a call from a WebMCP host and a call from the panel are one
 * `running` entry and the face cannot be lively for one and blank for the
 * other. The model is pure (`lib/agent/coach.ts`); what this hook owns is the
 * two things a pure function cannot — the moment a reaction is let go, and
 * the moment the face is allowed to change.
 *
 * ## The reaction
 *
 * Decided on the render where `running` goes back to `null`, keyed on the
 * call's id so a second identical call reacts again, and held for
 * `REACTION_MS`. A new call starting drops it at once: a face still pleased
 * about the last verdict while the next call runs would be describing the
 * wrong call. The decision is made **during render**, against the previous
 * `running`, rather than in an effect: it is state derived from a prop
 * changing, which is the one case React asks to be handled that way (and the
 * compiler's lint refuses the effect form).
 *
 * ## The dwell
 *
 * What the session says now is the *target*; what the face shows is `shown`,
 * and the two are allowed to differ for up to `DWELL_MS`. A target that
 * arrives while the face is still owed its time waits; when the wait ends the
 * face jumps to whatever the target is *then*. Leaving rest never waits. The
 * timer is the only writer of `shown`, so a dozen phase notes in a second
 * become two or three legible faces rather than a flicker.
 *
 * `shown` keeps the phase as a `Line` and the tool by name, never a sentence:
 * the words are looked up at render, so a language change while a face is
 * held does not leave it speaking the old one.
 */
export function useCoachMood(session: AgentSession): {
  mood: CoachMood;
  line: string;
  detail?: string;
} {
  const copy = useCopy();
  const { state } = session;
  const running = state.running;

  const [seen, setSeen] = useState<ToolCall | null>(running);
  const [held, setHeld] = useState<{ mood: CoachReaction; id: string } | null>(
    null,
  );

  if (running !== seen) {
    setSeen(running);
    if (running) {
      setHeld(null);
    } else if (seen) {
      const reaction = reactionFor(state, seen.id);
      setHeld(reaction ? { mood: reaction, id: seen.id } : null);
    }
  }

  useEffect(() => {
    if (!held) return;
    const timer = window.setTimeout(() => {
      setHeld((current) => (current?.id === held.id ? null : current));
    }, REACTION_MS);
    return () => window.clearTimeout(timer);
  }, [held]);

  /* The target: what the session says right now. */
  const mood = coachMood(state, held?.mood ?? null);
  const entry = running
    ? state.activity.find((e) => e.call?.id === running.id)
    : undefined;
  const phase: Line | undefined = entry?.phase;
  const tool: AgentTool | undefined = running?.name;

  const [shown, setShown] = useState<{
    mood: CoachMood;
    phase?: Line;
    tool?: AgentTool;
    since: number;
  }>(() => ({ mood, phase, tool, since: 0 }));

  useEffect(() => {
    if (shown.mood === mood && shown.phase === phase && shown.tool === tool) {
      return;
    }
    /* Always through the timer, even at zero: the clock is read here rather
       than in render, and the state is written from a callback rather than
       from the effect's own body. A change that arrives during a wait clears
       this timer and starts its own for the time that is left. */
    const timer = window.setTimeout(
      () => setShown({ mood, phase, tool, since: Date.now() }),
      dwellLeft(shown, Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [mood, phase, tool, shown]);

  /* Under the mood, while a call runs: the phase the handler has announced,
     or — before the first phase lands — the tool's own title. Nothing at
     rest; the panel header already carries the coach's name. */
  const detail = shown.phase
    ? say(copy, shown.phase)
    : shown.tool
      ? copy.agentPanel.toolTitles[shown.tool]
      : undefined;

  return { mood: shown.mood, line: copy.agentPanel.coach[shown.mood], detail };
}
