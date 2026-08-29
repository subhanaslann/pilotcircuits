"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Crosshair,
  Eye,
  Layers,
  Maximize,
  Play,
  RotateCcw,
  Ruler,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, SeverityPill, StatusChip } from "@/components/ui/badge";
import {
  Divider,
  MetadataLine,
  MonoValue,
  TextLink,
} from "@/components/ui/text";
import { SearchInput, TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CheckRow,
  RadioOption,
  SegmentedControl,
  Switch,
} from "@/components/ui/choice";
import {
  ActivityPulse,
  ProgressBar,
  StepLoader,
  type StepState,
} from "@/components/ui/feedback";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentMark, LogoMark, Wordmark } from "@/components/ui/brand-marks";
import { BuildProgress } from "@/components/ui/build-progress";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";

const glyph = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/* ---------------------------------------------------------------- A-01/A-02 */

export function ButtonSpecimens() {
  const copy = useCopy();
  const t = copy.lab.atoms.buttons;
  const [loading, setLoading] = useState(false);

  return (
    <>
      <LabBlock title={t.variants.title} note={t.variants.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" iconLeft={<Check {...glyph} />}>
              {copy.workbench.verify}
            </Button>
            <Button variant="secondary" iconLeft={<Eye {...glyph} />}>
              {copy.workbench.showMe}
            </Button>
            <Button variant="tertiary">{copy.workbench.iFixedIt}</Button>
            <Button variant="danger" iconLeft={<RotateCcw {...glyph} />}>
              {copy.workbench.resetDemo}
            </Button>
            <Button variant="quiet">{copy.library.clear}</Button>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.sizes.title} note={t.sizes.note}>
        <LabStage>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary">
                {t.sizes.small}
              </Button>
              <Button size="md" variant="secondary">
                {t.sizes.medium}
              </Button>
              <Button size="lg" variant="primary">
                {copy.workbench.runFullTest}
              </Button>
            </div>
            <Divider />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" iconRight={<ArrowRight {...glyph} />}>
                {copy.projectDetail.start}
              </Button>
              <Button
                variant="primary"
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1600);
                }}
              >
                {loading ? t.sizes.inspecting : copy.workbench.inspect}
              </Button>
              <Button variant="secondary" disabled>
                {t.sizes.disabled}
              </Button>
              <p className="text-caption text-ink-tertiary">
                {t.sizes.loadingHint(copy.workbench.inspect)}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.plate.title} note={t.plate.note}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="bg-app border-border rounded-lg border p-6">
            <p className="text-caption text-ink-tertiary mb-4">
              {t.plate.onApp}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" iconLeft={<Check {...glyph} />}>
                {copy.workbench.verify}
              </Button>
              <Button variant="secondary" iconLeft={<Eye {...glyph} />}>
                {copy.workbench.showMe}
              </Button>
              <Button variant="tertiary">{copy.workbench.iFixedIt}</Button>
            </div>
          </div>
          <div className="bg-surface border-border rounded-lg border p-6">
            <p className="text-caption text-ink-tertiary mb-4">
              {t.plate.onCard}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" iconLeft={<Check {...glyph} />}>
                {copy.workbench.verify}
              </Button>
              <Button variant="secondary" iconLeft={<Eye {...glyph} />}>
                {copy.workbench.showMe}
              </Button>
              <Button variant="tertiary">{copy.workbench.iFixedIt}</Button>
            </div>
          </div>
        </div>
      </LabBlock>

      <LabBlock title={t.icons.title} note={t.icons.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border bg-surface shadow-e2 inline-flex items-center gap-0.5 rounded-md border p-1">
              <IconButton label={copy.workbench.canvas.zoomIn} size="sm">
                <ZoomIn {...glyph} />
              </IconButton>
              <IconButton label={copy.workbench.canvas.zoomOut} size="sm">
                <ZoomOut {...glyph} />
              </IconButton>
              <Divider orientation="vertical" className="mx-1 my-1.5" />
              <IconButton label={copy.workbench.canvas.fitView} size="sm">
                <Maximize {...glyph} />
              </IconButton>
              <IconButton label={copy.workbench.canvas.layers} size="sm">
                <Layers {...glyph} />
              </IconButton>
            </div>
            <IconButton label={t.icons.focusFinding} variant="secondary">
              <Crosshair {...glyph} />
            </IconButton>
            <IconButton label={t.icons.remove} variant="quiet">
              <Trash2 {...glyph} />
            </IconButton>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}

/* ------------------------------------------------------------- A-03 to A-07 */

export function BadgeSpecimens() {
  const copy = useCopy();
  const t = copy.lab.atoms.badges;
  const [filters, setFilters] = useState<string[]>(["beginner"]);
  const [applied, setApplied] = useState<string[]>(["sensor", "servo"]);

  /* The chips hold ids, not labels: the state has to survive a language
     change, and a filter is the same filter in either language. */
  const filterOptions = [
    { id: "beginner", label: t.chips.filters.beginner },
    { id: "intermediate", label: t.chips.filters.intermediate },
    { id: "under40", label: t.chips.filters.under40 },
    { id: "readyNow", label: t.chips.filters.readyNow },
  ];
  const appliedLabels: Record<string, string> = {
    sensor: t.chips.applied.sensor,
    servo: t.chips.applied.servo,
  };

  const toggle = (value: string) =>
    setFilters((current) =>
      current.includes(value)
        ? current.filter((f) => f !== value)
        : [...current, value],
    );

  return (
    <>
      <LabBlock title={t.status.title} note={t.status.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status="ready">{copy.status.ready}</StatusChip>
            <StatusChip status="preview">{copy.status.preview}</StatusChip>
            <StatusChip status="inProgress">
              {copy.status.inProgress}
            </StatusChip>
            <StatusChip status="webMcpReady">{copy.nav.webMcpReady}</StatusChip>
            <Divider orientation="vertical" className="mx-1 h-7" />
            <StatusChip status="demoFeed">{copy.status.demoFeed}</StatusChip>
            <StatusChip status="boardSimulated">
              {copy.status.boardSimulated}
            </StatusChip>
            <StatusChip status="agentConnected">
              {copy.status.agentConnected}
            </StatusChip>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.severity.title} note={t.severity.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityPill severity="critical" />
            <SeverityPill severity="warning" />
            <SeverityPill severity="info" />
            <SeverityPill severity="warning" label={t.severity.blocksTest} />
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.chips.title} note={t.chips.note}>
        <LabStage className="space-y-4">
          <div>
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {t.chips.staticHeading}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip>{t.chips.tags.pins}</Chip>
              <Chip>{t.chips.tags.pwm}</Chip>
              <Chip>{t.chips.tags.distance}</Chip>
              <Chip>{t.chips.tags.polarity}</Chip>
            </div>
          </div>
          <div>
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {t.chips.toggleHeading}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((option) => (
                <Chip
                  key={option.id}
                  selected={filters.includes(option.id)}
                  onToggle={() => toggle(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {t.chips.appliedHeading}
            </p>
            <div className="flex min-h-7 flex-wrap gap-1.5">
              {applied.length ? (
                applied.map((id) => (
                  <Chip
                    key={id}
                    onRemove={() =>
                      setApplied((current) => current.filter((c) => c !== id))
                    }
                  >
                    {appliedLabels[id]}
                  </Chip>
                ))
              ) : (
                <span className="text-caption text-ink-tertiary">
                  {t.chips.empty}
                </span>
              )}
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.values.title} note={t.values.note}>
        <LabStage className="space-y-3">
          <p className="text-body text-ink max-w-prose">
            {t.values.connectedBefore} <MonoValue tone="error">D6</MonoValue>
            {t.values.connectedAfter} {t.values.expectsBefore}{" "}
            <MonoValue tone="target">D7</MonoValue>
            {t.values.expectsAfter} {t.values.powerBefore}{" "}
            <MonoValue>5V</MonoValue>
            {t.values.powerMiddle} <MonoValue tone="accent">18 cm</MonoValue>
            {t.values.powerAfter}
          </p>
          <Divider />
          <MetadataLine
            items={[
              t.values.meta.duration,
              t.values.meta.level,
              t.values.meta.steps,
            ]}
          />
          <MetadataLine
            items={[
              copy.inspection.cameraFrame,
              <span key="c" className="tnum">
                {t.values.confidence}
              </span>,
              "12:04:31",
            ]}
          />
          <Divider />
          <p className="text-body text-ink">
            {t.values.linkBefore}{" "}
            <TextLink href="/lab/foundations">
              {t.values.wiringReference}
            </TextLink>
            {t.values.linkAfter}{" "}
            <TextLink href="/lab" variant="standalone">
              {t.values.openLab}
            </TextLink>
          </p>
        </LabStage>
      </LabBlock>
    </>
  );
}

/* ------------------------------------------------------------- A-08 to A-14 */

export function ControlSpecimens() {
  const copy = useCopy();
  const t = copy.lab.atoms.controls;
  const kit = copy.lab.atoms.kit;
  const [query, setQuery] = useState("barrier");
  const [view, setView] = useState<"reference" | "current" | "compare">(
    "current",
  );
  const [coaching, setCoaching] = useState<"hint" | "explain" | "exact">(
    "hint",
  );
  const [kitChecked, setKitChecked] = useState({
    board: true,
    sensor: false,
    servo: true,
  });
  const [layers, setLayers] = useState({ labels: true, grid: true });
  const [difficulty, setDifficulty] = useState("any");
  const [duration, setDuration] = useState("any");
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const answers = [
    { value: "pin", label: t.quiz.answers.pin, correct: true },
    { value: "voltage", label: t.quiz.answers.voltage, correct: false },
    { value: "range", label: t.quiz.answers.range, correct: false },
  ];

  return (
    <>
      <LabBlock title={t.fields.title} note={t.fields.note}>
        <LabStage>
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder={copy.library.search}
              className="sm:col-span-2"
            />
            <TextInput
              label={t.fields.buildNote.label}
              placeholder={t.fields.buildNote.placeholder}
              hint={t.fields.buildNote.hint}
            />
            <TextInput
              label={t.fields.expectedPin.label}
              defaultValue="D9"
              error={t.fields.expectedPin.error}
              iconLeft={<Ruler {...glyph} />}
            />
            <Select
              label={copy.library.filters.difficulty}
              value={difficulty}
              onValueChange={setDifficulty}
              options={[
                { value: "any", label: t.fields.difficulty.any },
                {
                  value: "beginner",
                  label: t.fields.difficulty.beginner,
                  hint: t.fields.difficulty.beginnerHint,
                },
                {
                  value: "intermediate",
                  label: t.fields.difficulty.intermediate,
                  hint: t.fields.difficulty.intermediateHint,
                },
              ]}
            />
            <Select
              label={copy.library.filters.duration}
              value={duration}
              onValueChange={setDuration}
              options={[
                { value: "any", label: t.fields.duration.any },
                { value: "30", label: t.fields.duration.under30 },
                { value: "45", label: t.fields.duration.under45 },
                { value: "60", label: t.fields.duration.under60 },
              ]}
            />
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.segmented.title} note={t.segmented.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-6">
            <SegmentedControl
              label={t.segmented.canvasView}
              value={view}
              onValueChange={setView}
              options={[
                { value: "reference", label: copy.workbench.views.reference },
                { value: "current", label: copy.workbench.views.current },
                { value: "compare", label: copy.workbench.views.compare },
              ]}
            />
            <SegmentedControl
              label={copy.agentPanel.coaching.label}
              size="sm"
              value={coaching}
              onValueChange={setCoaching}
              options={[
                { value: "hint", label: copy.agentPanel.coaching.hint },
                { value: "explain", label: copy.agentPanel.coaching.explain },
                { value: "exact", label: copy.agentPanel.coaching.exact },
              ]}
            />
          </div>
          <p className="text-caption text-ink-tertiary mt-3">
            {t.segmented.selected} <MonoValue tone="quiet">{view}</MonoValue> ·{" "}
            <MonoValue tone="quiet">{coaching}</MonoValue>
          </p>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.choices.title} note={t.choices.note}>
        <LabStage>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-overline text-ink-tertiary mb-2 uppercase">
                {copy.projectDetail.required}
              </p>
              <div className="space-y-2">
                <CheckRow
                  checked={kitChecked.board}
                  onCheckedChange={(v) =>
                    setKitChecked((k) => ({ ...k, board: v }))
                  }
                  label={kit.board.label}
                  description={kit.board.detail}
                />
                <CheckRow
                  checked={kitChecked.sensor}
                  onCheckedChange={(v) =>
                    setKitChecked((k) => ({ ...k, sensor: v }))
                  }
                  label={kit.sensor.label}
                />
                <CheckRow
                  checked={kitChecked.servo}
                  onCheckedChange={(v) =>
                    setKitChecked((k) => ({ ...k, servo: v }))
                  }
                  label={kit.servo.label}
                />
                <CheckRow
                  checked={false}
                  indeterminate
                  onCheckedChange={() => {}}
                  label={kit.resistors.label}
                  description={kit.resistors.detail}
                />
                <CheckRow
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled
                  label={kit.arm.label}
                  description={kit.arm.detail}
                />
              </div>
            </div>

            <div>
              <p className="text-overline text-ink-tertiary mb-2 uppercase">
                {copy.workbench.canvas.layers}
              </p>
              <div className="border-border bg-surface max-w-64 rounded-md border p-1.5">
                <Switch
                  checked={layers.labels}
                  onCheckedChange={(v) =>
                    setLayers((l) => ({ ...l, labels: v }))
                  }
                  label={t.choices.pinLabels}
                />
                <Switch
                  checked={layers.grid}
                  onCheckedChange={(v) => setLayers((l) => ({ ...l, grid: v }))}
                  label={t.choices.technicalGrid}
                />
                <Switch
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled
                  label={t.choices.referenceOverlay}
                />
              </div>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.quiz.title} note={t.quiz.note}>
        <LabStage className="max-w-xl">
          <p className="text-body text-ink mb-3 font-medium">
            {t.quiz.question}
          </p>
          <div className="space-y-2">
            {answers.map((option) => (
              <RadioOption
                key={option.value}
                name="lab-quiz"
                value={option.value}
                checked={answer === option.value}
                onSelect={setAnswer}
                disabled={submitted}
                state={
                  !submitted
                    ? "idle"
                    : option.correct
                      ? answer === option.value
                        ? "correct"
                        : "revealed"
                      : answer === option.value
                        ? "incorrect"
                        : "idle"
                }
              >
                {option.label}
              </RadioOption>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button
              variant="primary"
              size="sm"
              disabled={!answer || submitted}
              onClick={() => setSubmitted(true)}
            >
              {t.quiz.check}
            </Button>
            {submitted ? (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setAnswer(null);
                }}
              >
                {t.quiz.retry}
              </Button>
            ) : null}
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}

/* ------------------------------------------------------------- A-15 to A-22 */

export function FeedbackSpecimens() {
  const copy = useCopy();
  const t = copy.lab.atoms.feedback;
  const [test, setTest] = useState<StepState[]>(["idle", "idle", "idle"]);
  const [running, setRunning] = useState(false);

  /* The seven steps are the product's own — the lab shows the same list the
     workbench does, so the names come from the build dictionary. */
  const steps = copy.build.steps;
  const buildSteps = [
    {
      id: "s1",
      name: steps.kit.name,
      minutes: 2,
      status: "completed" as const,
    },
    {
      id: "s2",
      name: steps.place.name,
      minutes: 4,
      status: "completed" as const,
    },
    { id: "s3", name: steps.sensor.name, minutes: 6, status: "issue" as const },
    {
      id: "s4",
      name: steps.servo.name,
      minutes: 5,
      status: "upcoming" as const,
    },
    {
      id: "s5",
      name: steps.leds.name,
      minutes: 4,
      status: "upcoming" as const,
    },
    {
      id: "s6",
      name: steps.upload.name,
      minutes: 8,
      status: "upcoming" as const,
    },
    {
      id: "s7",
      name: steps.test.name,
      minutes: 6,
      status: "upcoming" as const,
    },
  ];

  const runTest = (failServo: boolean) => {
    setRunning(true);
    setTest(["running", "idle", "idle"]);
    setTimeout(() => setTest(["passed", "running", "idle"]), 900);
    setTimeout(
      () => setTest(["passed", failServo ? "failed" : "passed", "running"]),
      1900,
    );
    setTimeout(() => {
      setTest(["passed", failServo ? "failed" : "passed", "passed"]);
      setRunning(false);
    }, 2800);
  };

  return (
    <>
      <LabBlock title={t.progress.title} note={t.progress.note}>
        <LabStage>
          <div className="bg-app rounded-lg p-6">
            <div className="flex flex-wrap items-start gap-8">
              <BuildProgress steps={buildSteps} className="w-fit" />
              <div className="pt-1">
                <p className="text-caption text-ink-tertiary mb-2">
                  {t.progress.compact}
                </p>
                <BuildProgress steps={buildSteps} compact className="w-fit" />
              </div>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.percentage.title} note={t.percentage.note}>
        <LabStage className="space-y-6">
          <div className="max-w-md">
            <p className="text-caption text-ink-tertiary mb-2.5">
              {t.percentage.countable}
            </p>
            <ProgressBar
              value={3}
              max={5}
              segments={5}
              tone="success"
              label={copy.projectDetail.required}
              valueLabel={t.percentage.partsOf}
            />
          </div>

          <div className="max-w-md">
            <p className="text-caption text-ink-tertiary mb-2.5">
              {t.percentage.complete}
            </p>
            <ProgressBar
              value={5}
              max={5}
              segments={5}
              label={copy.projectDetail.required}
              valueLabel={copy.projectDetail.allPresent}
            />
          </div>

          <div className="max-w-md">
            <p className="text-caption text-ink-tertiary mb-2.5">
              {t.percentage.continuous}
            </p>
            <ProgressBar
              value={62}
              label={t.percentage.uploading}
              valueLabel="62%"
            />
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.pulse.title} note={t.pulse.note}>
        <LabStage>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-10">
              <ActivityPulse state="idle" />
              <ActivityPulse state="working" tool="inspect_build" />
              <ActivityPulse state="offline" />
            </div>
            <div>
              <p className="text-caption text-ink-tertiary mb-2.5">
                {t.pulse.asChip}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ActivityPulse state="idle" chip />
                <ActivityPulse
                  state="working"
                  tool="verify_current_step"
                  chip
                />
                <ActivityPulse state="offline" chip />
              </div>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.tests.title} note={t.tests.note}>
        <LabStage>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button
              size="sm"
              variant="primary"
              iconLeft={<Play {...glyph} />}
              disabled={running}
              onClick={() => runTest(false)}
            >
              {t.tests.runPassing}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={running}
              onClick={() => runTest(true)}
            >
              {t.tests.runFailing}
            </Button>
          </div>
          <div className="border-border bg-surface max-w-md rounded-md border px-3 py-1.5">
            <StepLoader
              state={test[0]}
              label={copy.test.sensor}
              detail={test[0] === "passed" ? "18 cm" : undefined}
            />
            <StepLoader
              state={test[1]}
              label={copy.test.servo}
              detail={
                test[1] === "passed"
                  ? "0° → 90°"
                  : test[1] === "failed"
                    ? t.tests.servoOff
                    : undefined
              }
            />
            <StepLoader
              state={test[2]}
              label={copy.test.leds}
              detail={test[2] === "passed" ? t.tests.ledsOk : undefined}
            />
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.tooltip.title} note={t.tooltip.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-4">
            <Tooltip content={t.tooltip.fitView}>
              <IconButton
                label={copy.workbench.canvas.fitView}
                variant="secondary"
              >
                <Maximize {...glyph} />
              </IconButton>
            </Tooltip>
            <Tooltip side="right" content={t.tooltip.confidence}>
              <span className="text-caption text-ink-secondary border-border cursor-help border-b border-dashed">
                {copy.inspection.cameraFrame} ·{" "}
                {copy.lab.atoms.badges.values.confidence}
              </span>
            </Tooltip>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.marks.title} note={t.marks.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-10">
            <div className="flex items-center gap-4">
              <LogoMark size={32} className="text-accent" />
              <LogoMark size={24} className="text-accent" />
              <LogoMark size={20} className="text-ink" />
            </div>
            <Wordmark />
            <div className="flex items-center gap-3">
              <AgentMark />
              <AgentMark active />
              <span className="text-caption text-ink-tertiary">
                {t.marks.states}
              </span>
            </div>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
