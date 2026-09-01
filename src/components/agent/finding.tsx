"use client";

import type { ReactNode } from "react";
import { Chip, severityToTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorialRow, ToneDisc } from "@/components/ui/status";
import { MetadataLine, Sentence } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import {
  findingWords,
  type AffectedNode,
  type Evidence,
  type Finding,
} from "@/lib/agent/findings";
import { cn } from "@/lib/utils/cn";

/**
 * G-05 · Finding   ·   G-06 · Affected node chip   ·   G-07 · Evidence line
 *
 * The inventory calls this a card. It is not one, and the reason is rule 4: a
 * surface is a container for the user's input or for a countable object, never
 * a container for the agent's output. A finding is the agent telling you what
 * it noticed — a sentence in the interface, not a notification bolted onto it.
 * Two findings stacked read as one calm account of one build; two cards read as
 * two competing objects.
 *
 * So it is built on `EditorialRow`, the same shell as `Alert`: one filled disc
 * carrying all the colour, a dark title, a grey body, and a hairline between
 * siblings. What differs from an alert is only the body — four stacked blocks
 * instead of one line.
 *
 * Severity is the disc. A `SeverityPill` beside it would render the same fact
 * twice with two different glyphs; the severity *word* moves into the evidence
 * line instead, so rule 9 is still paid.
 */

/** The ring the canvas will draw on that pin, shrunk to 8px. */
const markColour = {
  error: "var(--color-wire-error)",
  target: "var(--color-wire-target)",
  neutral: "var(--color-border-strong)",
} as const;

export function AffectedNodeChip({
  node,
  onActivate,
  className,
}: {
  node: AffectedNode & { part: string };
  /** Takes the canvas to this pin. */
  onActivate?: (id: string) => void;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <Chip
      className={className}
      onActivate={onActivate ? () => onActivate(node.id) : undefined}
      label={copy.a11y.showOnWorkbench(node.part, node.terminal)}
      iconLeft={
        <span
          aria-hidden="true"
          className="block size-2 shrink-0 rounded-full border-2"
          style={{ borderColor: markColour[node.mark] }}
        />
      }
    >
      {node.part}
      <span aria-hidden="true" className="text-ink-tertiary">
        →
      </span>
      <span className="text-mono-sm tnum text-ink font-mono">
        {node.terminal}
      </span>
    </Chip>
  );
}

/**
 * `Warning · Camera frame · 94% confidence`.
 *
 * Provenance first, number second: `94%` on its own means nothing, and a
 * confidence that opens the line reads as a score for the finding rather than a
 * property of the evidence. No bar and no meter — a bar would claim progress
 * and a meter would dress a mock vision number up as instrumentation.
 */
export function EvidenceLine({
  evidence,
  severityWord,
  className,
}: {
  evidence: Evidence;
  severityWord?: string;
  className?: string;
}) {
  const copy = useCopy();
  /* Keyed off the kind rather than tested against one of them: a two-way test
     captions every new kind as an alignment check, and a wrong provenance is
     the one error on this line that still renders as a sentence. */
  const source = copy.findings.evidence[evidence.kind];
  /* The number is a reading, so it is mono; the word around it is prose. They
     are separate keys because Turkish writes the sign before the digits. */
  const value = copy.findings.confidenceValue(
    Math.round(evidence.confidence * 100),
  );

  return (
    <MetadataLine
      className={className}
      items={[
        severityWord,
        source,
        <Sentence
          key="confidence"
          text={copy.findings.confidence(value)}
          mono={{ [value]: "quiet" }}
        />,
      ]}
    />
  );
}

export function FindingRow({
  finding,
  resolved = false,
  correctionOpen = false,
  correctionId,
  onShow,
  onCheck,
  onSimulate,
  onFocusNode,
  className,
  children,
}: {
  finding: Finding;
  resolved?: boolean;
  correctionOpen?: boolean;
  /** Id of the correction this row's `Show me` reveals. */
  correctionId?: string;
  onShow?: () => void;
  /** `Check this`. A read: it asks the agent to look, it never writes a fix. */
  onCheck?: () => void;
  /**
   * `Move it for me` — a write, offered only where the person has no hands.
   *
   * On a bench laid out by the author there is nothing to drag, so a read-only
   * check would leave the build with no route to a fix. The button says out
   * loud who is doing the moving, which is the whole difference between this
   * and the `I fixed it` it replaced.
   */
  onSimulate?: () => void;
  onFocusNode?: (id: string) => void;
  className?: string;
  /** The correction (G-08), rendered inside the text column. */
  children?: ReactNode;
}) {
  const copy = useCopy();
  const words = findingWords(copy, finding);

  /* Two of the four resolve to the same sentence — a wire is back where it
     belongs whether it was in the wrong hole or in no hole at all. The stray
     needs its own: nothing matches now, the join is gone, and
     `Connection matches now` would congratulate the person for the opposite of
     what they just did. */
  const resolvedTitle =
    finding.type === "mechanical-alignment"
      ? copy.findings.resolvedServo
      : finding.type === "unexpected-connection"
        ? copy.findings.resolvedExtra
        : finding.type === "part-not-placed"
          ? copy.findings.resolvedPart
          : copy.findings.resolvedConnection;

  if (resolved) {
    return (
      <div className={cn("motion-expand flex gap-3 py-3", className)}>
        <ToneDisc tone="success" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-h3 text-ink">{resolvedTitle}</p>
          <MetadataLine
            className="mt-1"
            items={[copy.findings.resolvedMeta, words.expected]}
          />
        </div>
      </div>
    );
  }

  /* No `role="status"` on the card, and that is a removal rather than an
     oversight. `role="status"` implies `aria-live="polite"` and
     `aria-atomic="true"`, so every finding in the list was its own live region:
     opening the Findings tab announced all of them, and any re-render of a card
     — pressing `Show me`, ticking a check, changing the coaching level —
     re-announced the whole card from the top. The arrival of a finding is
     already said once by the panel's single `LiveRegion` and, for a tool
     effect, once more by the toast; this was a third copy of the same event,
     attached to something that is a list item and not an event. §16 asks for a
     live region on status changes, not on the things the status is about. */
  return (
    <EditorialRow
      tone={severityToTone[finding.severity]}
      role="none"
      className={className}
    >
      <p className="text-h3 text-ink">{words.title}</p>

      <EvidenceLine
        className="mt-1"
        evidence={finding.evidence}
        severityWord={copy.findings.severity[finding.severity]}
      />

      {/* The third state, and the reason the honest check is usable.

          `Check this` is a read, so a build nobody has touched renders exactly
          the row that was already on screen — a button that appears to do
          nothing, which is how an accurate answer gets read as a broken
          control. This line is the answer made visible: the agent looked, and
          the fault is still there. It is metadata rather than a new heading
          because nothing about the finding changed; only the reading did. */}
      {finding.checkedAt && finding.lastCheck !== "resolved" ? (
        <MetadataLine
          className="mt-1"
          items={[
            finding.lastCheck === "unreachable"
              ? copy.findings.checkedUnreachable
              : copy.findings.checkedStillOpen,
          ]}
        />
      ) : null}

      <Sentence
        className="text-body-sm text-ink-secondary mt-2 block"
        text={words.explanation}
        mono={words.mono}
      />

      {words.nodes.length ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {words.nodes.map((node) => (
            <AffectedNodeChip
              key={node.id}
              node={node}
              onActivate={onFocusNode}
            />
          ))}
        </div>
      ) : null}

      {/* 16px on both axes: each button paints a 6px plate all round, so a
          tighter gap makes two plates overlap (design-language.md, rule 2). */}
      <div className="mt-3 flex flex-wrap gap-4">
        {onShow ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onShow}
            aria-expanded={correctionOpen}
            aria-controls={correctionId}
          >
            {words.actions.show}
          </Button>
        ) : null}
        {onCheck ? (
          <Button variant="tertiary" size="sm" onClick={onCheck}>
            {words.actions.check}
          </Button>
        ) : null}
        {onSimulate ? (
          <Button variant="tertiary" size="sm" onClick={onSimulate}>
            {copy.workbench.moveItForMe}
          </Button>
        ) : null}
      </div>

      {children}
    </EditorialRow>
  );
}
