import type { Line } from "@/lib/agent/line";
import type { AgentTool } from "@/lib/agent/model";

/**
 * Batch 4 · The record.
 *
 * The timeline is a record of a collaboration, not a changelog. Both parties
 * appear in it: the agent reads, compares and points; the person moves the wire.
 * A log that showed only the agent would make the product's central claim — two
 * partners on one build — invisible in the one place it is written down.
 */

export type ActivityStatus = "running" | "ok" | "error";

export type ActivityActor = "agent" | "user" | "system";

export interface ToolCall {
  id: string;
  name: AgentTool;
  args: Record<string, unknown>;
  /** One line, for the summary row: `scope: current_step`. Never raw JSON. */
  argsSummary: string;
  status: ActivityStatus;
  /** Absent while running — which is what makes an entry visibly in flight. */
  result?: unknown;
  errorMessage?: Line;
  durationMs?: number;
  startedAt: number;
}

export interface ActivityEntry {
  id: string;
  actor: ActivityActor;
  /**
   * Human language, present from the first frame. Never a tool name — and
   * never a rendered string either: the words are looked up at render so a
   * record written in one language reads correctly in the other.
   */
  headline: Line;
  /** Written on settle: `1 connection mismatch found`. */
  outcome?: Line;
  /** The last phase note while running: `Comparing against the sketch`. */
  phase?: Line;
  status: ActivityStatus;
  /**
   * Preformatted clock, `14:32`. Absent while running — the clock arriving is
   * itself the completion signal. Preformatted because formatting a timestamp
   * at render splits between server and client and because a relative time
   * (`2 min ago`) would need a timer re-rendering the panel forever.
   */
  time?: string;
  /** Terminal shape for an outcome entry. */
  tone?: "found" | "passed" | "failed";
  /** Present only for `actor: "agent"`. An outcome is not a call of its own. */
  call?: ToolCall;
  findingIds?: string[];
}

/** `14:32`, in the viewer's own hours and minutes. */
export function clockOf(at: number): string {
  const date = new Date(at);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** `scope: current_step · detail: hint`. Empty when the tool takes no input. */
export function summariseArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}
