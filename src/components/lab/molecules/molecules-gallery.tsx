"use client";

import { useState } from "react";
import {
  Cpu,
  Crosshair,
  Eye,
  Gauge,
  Layers,
  Maximize,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  TriangleAlert,
  Wrench,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, SeverityPill, StatusChip } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  KeyValueRow,
  ListRow,
  Panel,
} from "@/components/ui/card";
import { Tabs, TabPanel, Toolbar } from "@/components/ui/tabs";
import {
  Drawer,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Popover,
} from "@/components/ui/overlay";
import { Disclosure, RawJson } from "@/components/ui/disclosure";
import {
  Alert,
  AlertStack,
  EmptyState,
  LiveRegion,
  Skeleton,
  ToastViewport,
  useToasts,
} from "@/components/ui/status";
import { Checkbox, SegmentedControl } from "@/components/ui/choice";
import { SearchInput } from "@/components/ui/input";
import { Divider, MetadataLine, Sentence } from "@/components/ui/text";
import { ActivityPulse } from "@/components/ui/feedback";
import { BuildProgress } from "@/components/ui/build-progress";
import { AgentMark } from "@/components/ui/brand-marks";
import { BackHeader, Breadcrumb } from "@/components/ui/nav";
import { brand } from "@/content/brand";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/* ----------------------------------------------------------- M-01/M-02/M-13 */

export function ContainerSpecimens() {
  const copy = useCopy();
  const t = copy.lab.molecules.containers;

  return (
    <>
      <LabBlock title={t.cards.title} note={t.cards.note}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={copy.build.project}
              meta={
                <MetadataLine
                  items={[
                    t.project.duration,
                    copy.lab.molecules.navigation.difficulty.beginner,
                    t.project.steps,
                  ]}
                />
              }
              action={
                <StatusChip status="inProgress">
                  {copy.status.inProgress}
                </StatusChip>
              }
            />
            <p className="text-body-sm text-ink-secondary mt-3">
              {t.project.body}
            </p>
            <CardFooter>
              <Button variant="primary" size="sm">
                {t.project.continueBuild}
              </Button>
              <Button variant="tertiary" size="sm">
                {t.project.viewProject}
              </Button>
            </CardFooter>
          </Card>

          <Card tone="warning">
            <CardHeader
              title={copy.findings.connectionMismatch}
              meta={
                <MetadataLine
                  items={[
                    copy.inspection.cameraFrame,
                    <span key="c" className="tnum">
                      {copy.findings.confidence(
                        copy.findings.confidenceValue(94),
                      )}
                    </span>,
                  ]}
                />
              }
              action={<SeverityPill severity="warning" />}
            />
            <p className="text-body-sm text-ink-secondary mt-2.5">
              <Sentence
                text={copy.findings.wrongPin("Echo", "D6", "D7")}
                mono={{ D6: "error", D7: "target" }}
              />
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip iconLeft={<Gauge size={12} strokeWidth={2} />}>
                {copy.build.parts.sensor} → Echo
              </Chip>
              <Chip iconLeft={<Cpu size={12} strokeWidth={2} />}>
                {copy.device.board} → D7
              </Chip>
            </div>
            <CardFooter>
              <Button variant="secondary" size="sm" iconLeft={<Eye {...g} />}>
                {copy.workbench.showMe}
              </Button>
              <Button variant="tertiary" size="sm">
                {copy.workbench.checkThis}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </LabBlock>

      <LabBlock title={t.panel.title} note={t.panel.note}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            className="h-72 rounded-xl"
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-h3 text-ink">
                  {copy.projectDetail.stepPreview}
                </h3>
                <span className="text-mono-sm text-ink-tertiary tnum font-mono">
                  3 / 7
                </span>
              </div>
            }
            footer={
              <Button variant="primary" size="sm" block>
                {copy.workbench.verify}
              </Button>
            }
            bodyClassName="p-2"
          >
            <ul className="space-y-0.5">
              {[
                copy.build.steps.kit.name,
                copy.build.steps.place.name,
                copy.build.steps.sensor.name,
                copy.build.steps.servo.name,
                copy.build.steps.leds.name,
                copy.build.steps.upload.name,
                copy.build.steps.test.name,
              ].map((step, index) => (
                <ListRow
                  as="li"
                  key={step}
                  active={index === 2}
                  leading={
                    <span className="text-mono-sm text-ink-tertiary tnum w-4 font-mono">
                      {index + 1}
                    </span>
                  }
                  trailing={
                    index === 2 ? (
                      <TriangleAlert
                        size={14}
                        strokeWidth={2}
                        className="text-warning"
                        aria-label={t.hasFinding}
                      />
                    ) : (
                      <span className="text-mono-sm text-ink-tertiary tnum font-mono">
                        {[2, 4, 6, 5, 4, 8, 6][index]}m
                      </span>
                    )
                  }
                >
                  <span className="text-body-sm">{step}</span>
                </ListRow>
              ))}
            </ul>
          </Panel>

          <Panel
            className="h-72 rounded-xl"
            header={
              <div className="flex items-center gap-2.5">
                <AgentMark size={26} active />
                <div className="min-w-0">
                  <p className="text-h3 text-ink">{brand.agentName}</p>
                  <p className="text-caption text-ink-tertiary">
                    {copy.status.connectedViaWebMcp} ·{" "}
                    {copy.status.toolsAvailable(6)}
                  </p>
                </div>
                <ActivityPulse
                  state="working"
                  tool="inspect_build"
                  className="ml-auto"
                />
              </div>
            }
            bodyClassName="p-4"
          >
            <dl>
              <KeyValueRow
                label={copy.device.board}
                value={copy.device.boardValue}
              />
              <KeyValueRow
                label={copy.device.port}
                value={copy.device.portValue}
              />
              <KeyValueRow
                label={copy.device.voltage}
                value={copy.device.voltageValue}
              />
              <KeyValueRow
                label={copy.device.lastSerial}
                value="Distance: 18 cm"
              />
            </dl>
            <Divider className="my-3" />
            <Skeleton lines={3} />
            <p className="text-caption text-ink-tertiary mt-2">
              {t.skeletonNote}
            </p>
          </Panel>
        </div>
      </LabBlock>
    </>
  );
}

/* --------------------------------------------------------------- M-03/M-04 */

export function NavigationSpecimens() {
  const copy = useCopy();
  const t = copy.lab.molecules.navigation;

  /* Fixture data for the progress control. Only the minutes and the statuses
     are made up — the names are the build's own, from the dictionary. */
  const topbarSteps = [
    {
      id: "s1",
      name: copy.build.steps.kit.name,
      minutes: 2,
      status: "completed" as const,
    },
    {
      id: "s2",
      name: copy.build.steps.place.name,
      minutes: 4,
      status: "completed" as const,
    },
    {
      id: "s3",
      name: copy.build.steps.sensor.name,
      minutes: 6,
      status: "issue" as const,
    },
    {
      id: "s4",
      name: copy.build.steps.servo.name,
      minutes: 5,
      status: "upcoming" as const,
    },
    {
      id: "s5",
      name: copy.build.steps.leds.name,
      minutes: 4,
      status: "upcoming" as const,
    },
    {
      id: "s6",
      name: copy.build.steps.upload.name,
      minutes: 8,
      status: "upcoming" as const,
    },
    {
      id: "s7",
      name: copy.build.steps.test.name,
      minutes: 6,
      status: "upcoming" as const,
    },
  ];

  const [tab, setTab] = useState<"guidance" | "findings" | "activity">(
    "findings",
  );
  const [dock, setDock] = useState<"device" | "serial" | "test">("device");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"reference" | "current" | "compare">(
    "current",
  );

  return (
    <>
      <LabBlock title={t.tabs.title} note={t.tabs.note}>
        <LabStage>
          <Tabs
            label={t.agentWorkspace}
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "guidance", label: copy.agentPanel.tabs.guidance },
              {
                value: "findings",
                label: copy.agentPanel.tabs.findings,
                count: 1,
              },
              {
                value: "activity",
                label: copy.agentPanel.tabs.activity,
                count: 5,
              },
            ]}
          />
          <div className="pt-3">
            <TabPanel active={tab === "guidance"}>
              <p className="text-body-sm text-ink-secondary">
                <Sentence
                  text={copy.build.steps.sensor.instruction}
                  mono={{ D7: "target" }}
                />
              </p>
            </TabPanel>
            <TabPanel active={tab === "findings"}>
              <p className="text-body-sm text-ink-secondary">
                {t.panels.findings}
              </p>
            </TabPanel>
            <TabPanel active={tab === "activity"}>
              <p className="text-body-sm text-ink-secondary">
                {t.panels.activity}
              </p>
            </TabPanel>
          </div>

          <Divider className="my-6" />

          <Tabs
            size="sm"
            label={t.deviceDock}
            value={dock}
            onValueChange={setDock}
            items={[
              { value: "device", label: copy.device.tabs.device },
              { value: "serial", label: copy.device.tabs.serial },
              { value: "test", label: copy.device.tabs.test },
            ]}
          />
        </LabStage>
      </LabBlock>

      <LabBlock title={t.toolbars.title} note={t.toolbars.note}>
        <LabStage className="space-y-4">
          <Toolbar>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder={copy.library.search}
              className="w-64"
            />
            <FilterPopover />
            <Chip selected onToggle={() => {}}>
              {t.difficulty.beginner}
            </Chip>
            <Chip onToggle={() => {}}>{copy.library.filters.readyNow}</Chip>
            <span className="text-caption text-ink-tertiary ml-auto">
              {t.projectCount(7)}
            </span>
          </Toolbar>

          <div className="bg-surface-sunken grid-technical rounded-xl p-6">
            <Toolbar floating className="inline-flex w-auto">
              <IconButton label={copy.workbench.canvas.zoomIn} size="sm">
                <ZoomIn {...g} />
              </IconButton>
              <IconButton label={copy.workbench.canvas.zoomOut} size="sm">
                <ZoomOut {...g} />
              </IconButton>
              <IconButton label={copy.workbench.canvas.fitView} size="sm">
                <Maximize {...g} />
              </IconButton>
              <Divider orientation="vertical" className="mx-0.5 my-1.5" />
              <SegmentedControl
                size="sm"
                label={t.canvasView}
                value={view}
                onValueChange={setView}
                options={[
                  { value: "reference", label: copy.workbench.views.reference },
                  { value: "current", label: copy.workbench.views.current },
                  { value: "compare", label: copy.workbench.views.compare },
                ]}
              />
              <LayersPopover />
            </Toolbar>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.header.title} note={t.header.note}>
        <LabStage className="space-y-4 p-0">
          <BackHeader
            backHref="/lab"
            backLabel={copy.workbench.back}
            title={copy.build.project}
            meta={<BuildProgress steps={topbarSteps} compact />}
            actions={
              <>
                <StatusChip status="demoFeed">
                  {copy.status.demoFeed}
                </StatusChip>
                <StatusChip status="boardSimulated">
                  {copy.status.boardSimulated}
                </StatusChip>
                <StatusChip status="agentConnected">
                  {copy.status.agentConnected}
                </StatusChip>
                <DemoMenu />
              </>
            }
            className="rounded-t-lg"
          />
          <div className="px-5 pb-5">
            <Breadcrumb
              items={[
                { label: copy.nav.projects, href: "/lab" },
                { label: copy.build.project, href: "/lab" },
                { label: t.workbench },
              ]}
            />
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}

function FilterPopover() {
  const [difficulty, setDifficulty] = useState<string[]>(["beginner"]);

  const toggle = (value: string) =>
    setDifficulty((current) =>
      current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    );
  const copy = useCopy();
  const t = copy.lab.molecules.navigation.difficulty;

  return (
    <Popover
      label={t.filter}
      width="sm"
      trigger={({ open, toggle: t }) => (
        <Button
          variant={open ? "secondary" : "tertiary"}
          size="sm"
          onClick={t}
          iconLeft={<SlidersHorizontal {...g} />}
        >
          {copy.library.filters.difficulty}
        </Button>
      )}
    >
      <MenuLabel>{copy.library.filters.difficulty}</MenuLabel>
      <div className="space-y-2 p-2.5">
        {[
          { value: "beginner", label: t.beginner },
          { value: "intermediate", label: t.intermediate },
        ].map((option) => (
          <Checkbox
            key={option.value}
            checked={difficulty.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
            label={option.label}
          />
        ))}
      </div>
    </Popover>
  );
}

function LayersPopover() {
  const copy = useCopy();
  const t = copy.lab.molecules.navigation.layers;

  return (
    <Popover
      label={copy.workbench.canvas.layers}
      align="end"
      width="sm"
      trigger={({ toggle }) => (
        <IconButton
          label={copy.workbench.canvas.layers}
          size="sm"
          onClick={toggle}
        >
          <Layers {...g} />
        </IconButton>
      )}
    >
      <MenuLabel>{copy.workbench.canvas.layers}</MenuLabel>
      <MenuItem icon={<Crosshair {...g} />}>{t.pins}</MenuItem>
      <MenuItem icon={<Wrench {...g} />}>{t.wires}</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Settings2 {...g} />}>{t.grid}</MenuItem>
    </Popover>
  );
}

function DemoMenu() {
  const copy = useCopy();
  const t = copy.lab.molecules.navigation.demo;

  return (
    <Popover
      label={copy.workbench.demoControls}
      align="end"
      width="md"
      trigger={({ toggle }) => (
        <IconButton
          label={copy.workbench.demoControls}
          size="sm"
          variant="tertiary"
          onClick={toggle}
        >
          <Settings2 {...g} />
        </IconButton>
      )}
    >
      {({ close }) => (
        <>
          <MenuLabel>{t.jumpTo}</MenuLabel>
          <MenuItem onClick={close}>{t.wiringIssue}</MenuItem>
          <MenuItem onClick={close}>{t.servoIssue}</MenuItem>
          <MenuItem onClick={close}>{t.fullSystemTest}</MenuItem>
          <MenuSeparator />
          <MenuLabel>{t.inject}</MenuLabel>
          <MenuItem onClick={close}>{t.wrongEcho}</MenuItem>
          <MenuItem onClick={close}>{t.servoOrientation}</MenuItem>
          <MenuSeparator />
          <MenuItem danger icon={<RotateCcw {...g} />} onClick={close}>
            {t.resetAll}
          </MenuItem>
        </>
      )}
    </Popover>
  );
}

/* --------------------------------------------------- M-07 to M-12, M-16/17 */

export function OverlaySpecimens() {
  const copy = useCopy();
  const t = copy.lab.molecules.overlays;
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { toasts, push, dismiss } = useToasts();
  const [announced, setAnnounced] = useState("");

  return (
    <>
      <LabBlock title={t.modal.title} note={t.modal.note}>
        <LabStage>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              onClick={() => setModal(true)}
              iconLeft={<Search {...g} />}
            >
              {t.openModal}
            </Button>
            <Button variant="tertiary" onClick={() => setDrawer(true)}>
              {t.openDrawer}
            </Button>
          </div>
        </LabStage>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          size="wide"
          title={copy.inspection.title}
          description={t.modalDescription}
          footer={
            <>
              <Button variant="tertiary" onClick={() => setModal(false)}>
                {t.close}
              </Button>
              <Button variant="primary" onClick={() => setModal(false)}>
                {copy.workbench.showMe}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-overline text-ink-tertiary uppercase">
                  {copy.inspection.cameraFrame}
                </p>
                <StatusChip status="demoFeed">
                  {copy.inspection.demoVisionResult}
                </StatusChip>
              </div>
              <div className="bg-surface-sunken grid-technical layer-sunken grid h-56 place-items-center rounded-lg">
                <p className="text-caption text-ink-tertiary">
                  {t.illustrationPending}
                </p>
              </div>
            </div>
            <div>
              <p className="text-overline text-ink-tertiary mb-2 uppercase">
                {copy.inspection.referenceView}
              </p>
              <div className="bg-surface-sunken grid-technical layer-sunken grid h-56 place-items-center rounded-lg">
                <p className="text-caption text-ink-tertiary">
                  {t.referenceBuild}
                </p>
              </div>
            </div>
          </div>
          <Divider label={copy.inspection.findingsSummary} className="my-4" />
          <Alert tone="warning" title={copy.findings.connectionMismatch}>
            <Sentence
              text={copy.findings.wrongPin("Echo", "D6", "D7")}
              mono={{ D6: "error", D7: "target" }}
            />
          </Alert>
        </Modal>

        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title={brand.agentName}
        >
          <Alert tone="info" title={copy.agentPanel.coaching.hint}>
            {copy.findings.hint("Echo")}
          </Alert>
          <div className="mt-4">
            <Disclosure summary={copy.workbench.whyThisPin}>
              <Sentence
                text={copy.findings.explain("Echo", "D7")}
                mono={{ D7: "default" }}
              />
            </Disclosure>
          </div>
        </Drawer>
      </LabBlock>

      <LabBlock title={t.alerts.title} note={t.alerts.note}>
        <LabStage>
          <AlertStack>
            <Alert
              tone="info"
              title={copy.projectDetail.demoModeNotice}
              action={
                <Button variant="secondary" size="sm">
                  {copy.projectDetail.start}
                </Button>
              }
            >
              {copy.projectDetail.demoModeDetail}
            </Alert>
            <Alert tone="success" title={copy.workbench.stepVerified}>
              {copy.agentPanel.context.allMatch}
            </Alert>
            <Alert tone="warning" title={copy.workbench.correctionHighlighted}>
              {t.correctionMarked}
            </Alert>
            <Alert tone="error" title={t.barrierFailed}>
              {t.barrierFailedDetail}
            </Alert>
          </AlertStack>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.toasts.title} note={t.toasts.note}>
        <LabStage>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                push(copy.workbench.correctionHighlighted);
                setAnnounced(copy.workbench.correctionHighlighted);
              }}
            >
              {t.pushCorrection}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                push(copy.workbench.stepVerified);
                setAnnounced(copy.workbench.stepVerified);
              }}
            >
              {t.pushVerified}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                push(t.barrierFailed, "error");
                setAnnounced(t.barrierFailed);
              }}
            >
              {t.pushFailure}
            </Button>
          </div>
          {announced ? (
            <p className="text-caption text-ink-tertiary mt-3">
              {t.announced}{" "}
              <span className="text-ink-secondary">{announced}</span>
            </p>
          ) : null}
          <LiveRegion message={announced} />
        </LabStage>
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
      </LabBlock>

      <LabBlock title={t.disclosure.title} note={t.disclosure.note}>
        <LabStage className="max-w-xl">
          <Disclosure summary={copy.workbench.whyThisPin}>
            <Sentence
              text={t.explainFull}
              mono={{ D7: "default", D6: "default" }}
            />
          </Disclosure>
          <Divider className="my-2" />
          <Disclosure tone="quiet" summary={copy.agentPanel.developerDetails}>
            <dl className="mb-2">
              <KeyValueRow label={t.toolLabel} value="inspect_build" />
              <KeyValueRow label={t.scopeLabel} value="current_step" />
              <KeyValueRow label={copy.agentPanel.tabs.findings} value="1" />
              <KeyValueRow
                label={copy.agentPanel.details.durationLabel}
                value={copy.agentPanel.details.ms(240)}
              />
            </dl>
            <RawJson
              value={{
                findings: [
                  {
                    id: "f_echo_pin",
                    type: "wiring",
                    severity: "warning",
                    expected: "D7",
                    observed: "D6",
                    confidence: 0.94,
                    evidence_source: "demo_camera_frame",
                  },
                ],
              }}
            />
          </Disclosure>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.empty.title} note={t.empty.note}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card padded={false}>
            <EmptyState
              title={copy.agentPanel.noFindings}
              description={copy.agentPanel.noFindingsHint}
              action={
                <Button variant="secondary" size="sm">
                  {copy.workbench.inspect}
                </Button>
              }
            />
          </Card>
          <Card padded={false}>
            <EmptyState
              icon={<Search size={icon.lg} strokeWidth={icon.strokeWidth} />}
              title={copy.library.empty}
              description={copy.library.emptyHint}
              action={
                <Button variant="tertiary" size="sm">
                  {copy.library.clear}
                </Button>
              }
            />
          </Card>
          <Card padded={false}>
            <EmptyState
              title={copy.agentPanel.noActivity}
              description={t.activityEmpty}
            />
          </Card>
        </div>
      </LabBlock>
    </>
  );
}
