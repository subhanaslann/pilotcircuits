"use client";

import { useState } from "react";
import { LabBlock } from "@/components/lab/lab-primitives";
import { Button } from "@/components/ui/button";
import { BuildProgress } from "@/components/ui/build-progress";
import { useCopy } from "@/content/copy-provider";

/**
 * The chosen build-progress control, driven live.
 *
 * The fraction is the headline — progress here is seven named steps, not a
 * percentage — and the ticks beside it let you count what is left without
 * reading a number. Clicking it opens the full list.
 *
 * The step names are the product's own: this is the same list the workbench
 * shows, so it is read from the build dictionary rather than restated here.
 */

/** Estimated minutes per step, in build order. */
const MINUTES = [2, 4, 6, 5, 4, 8, 6];
const STEP_COUNT = MINUTES.length;

type Demo = { current: number; issue: boolean };

function useDemo(): [Demo, () => void, () => void, () => void] {
  const [demo, setDemo] = useState<Demo>({ current: 3, issue: true });
  const advance = () =>
    setDemo((d) => ({
      current: Math.min(STEP_COUNT, d.current + 1),
      issue: false,
    }));
  const back = () =>
    setDemo((d) => ({ current: Math.max(1, d.current - 1), issue: false }));
  const toggleIssue = () => setDemo((d) => ({ ...d, issue: !d.issue }));
  return [demo, advance, back, toggleIssue];
}

function toSteps(names: string[], demo: Demo) {
  return names.map((name, index) => ({
    id: `s${index + 1}`,
    name,
    minutes: MINUTES[index],
    status:
      index + 1 < demo.current
        ? ("completed" as const)
        : index + 1 === demo.current
          ? demo.issue
            ? ("issue" as const)
            : ("active" as const)
          : ("upcoming" as const),
  }));
}

export function ProgressOptions() {
  const copy = useCopy();
  const t = copy.lab.atoms.buttonsLab.progress;
  const [demo, advance, back, toggleIssue] = useDemo();
  const [jumped, setJumped] = useState<string | null>(null);

  const build = copy.build.steps;
  const steps = toSteps(
    [
      build.kit.name,
      build.place.name,
      build.sensor.name,
      build.servo.name,
      build.leds.name,
      build.upload.name,
      build.test.name,
    ],
    demo,
  );

  return (
    <>
      <LabBlock title={t.drive.title} note={t.drive.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" variant="secondary" onClick={back}>
              {t.drive.previous}
            </Button>
            <Button size="sm" variant="primary" onClick={advance}>
              {copy.workbench.verify}
            </Button>
            <Button
              size="sm"
              variant={demo.issue ? "danger" : "tertiary"}
              onClick={toggleIssue}
            >
              {demo.issue ? t.drive.clearFinding : t.drive.injectFinding}
            </Button>
            <p className="text-caption text-ink-tertiary">
              <span className="tnum">
                {copy.workbench.stepOf(demo.current, STEP_COUNT)}
              </span>
              {demo.issue ? ` · ${t.drive.blocked}` : ""}
              {jumped ? ` · ${t.drive.jumpedTo(jumped)}` : ""}
            </p>
          </div>
        </div>
      </LabBlock>

      <LabBlock title={t.collapsed.title} note={t.collapsed.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="bg-app rounded-lg p-8">
            <BuildProgress
              steps={steps}
              onSelectStep={(id) => {
                const step = steps.find((s) => s.id === id);
                setJumped(step?.name ?? null);
              }}
              className="w-fit"
            />
          </div>
        </div>
      </LabBlock>

      <LabBlock title={t.compact.title} note={t.compact.note}>
        <div className="border-border bg-surface shadow-e1 rounded-xl border p-5">
          <div className="bg-app rounded-lg p-5">
            <div className="bg-surface border-border flex h-16 items-center gap-4 rounded-xl border px-4">
              <span className="text-h3 text-ink shrink-0">
                {copy.build.project}
              </span>
              <span className="text-caption text-ink-tertiary tnum shrink-0">
                {copy.workbench.stepOf(demo.current, STEP_COUNT)}
              </span>
              <BuildProgress steps={steps} compact className="shrink-0" />
            </div>
          </div>
        </div>
      </LabBlock>
    </>
  );
}
