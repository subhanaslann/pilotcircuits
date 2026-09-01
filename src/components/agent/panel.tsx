"use client";

import type { ReactNode } from "react";
import { AgentMark } from "@/components/ui/brand-marks";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { ActivityPulse, type PulseState } from "@/components/ui/feedback";
import { MenuLabel, Popover } from "@/components/ui/overlay";
import { Alert, LiveRegion } from "@/components/ui/status";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { ToolBadge } from "@/components/agent/activity";
import { brand } from "@/content/brand";
import { useCopy } from "@/content/copy-provider";
import type { Copy } from "@/content/i18n";
import { workbenchTools, type AgentTool } from "@/lib/agent/model";
import { cn } from "@/lib/utils/cn";

/**
 * G-01 · Panel header   ·   G-13 · WebMCP notice
 * G-14 · Suggested action   ·   G-15 · Tool inventory
 *
 * The frame the agent writes into. `Panel` (M-02) already provides the shape —
 * sticky header, one scrolling body, pinned foot — so nothing here re-invents
 * it; the tabs move up into the header so they never scroll away, and the
 * header's own rule is turned off because the tab bar brings one of its own.
 *
 * The body's vertical padding is not decoration: `.scroll-fade` masks the top
 * and bottom 10px unconditionally, so without it the first row would sit
 * permanently half-faded.
 */

export type AgentTab = "guidance" | "findings" | "activity";

const toolPurposes = (copy: Copy): Record<AgentTool, string> => ({
  get_build_context: copy.agentPanel.tools.get_build_context,
  inspect_build: copy.agentPanel.tools.inspect_build,
  show_correction: copy.agentPanel.tools.show_correction,
  attach_lead: copy.agentPanel.tools.attach_lead,
  verify_current_step: copy.agentPanel.tools.verify_current_step,
  navigate_build_step: copy.agentPanel.tools.navigate_build_step,
  run_functional_test: copy.agentPanel.tools.run_functional_test,
  /* Batch 8 · the library's four. They are never registered while the workbench
     is open, so `ToolInventory` below still lists only `workbenchTools` and the
     header's count is still six. They are here because the timeline is shared:
     an entry written on `/projects` is read on this panel. */
  find_projects: copy.agentPanel.tools.find_projects,
  open_project: copy.agentPanel.tools.open_project,
  get_project_requirements: copy.agentPanel.tools.get_project_requirements,
  start_project: copy.agentPanel.tools.start_project,
});

/**
 * G-15 · Tool inventory
 *
 * `6 tools available` as a claim you can check. WebMCP is supposed to be the
 * structure of this product rather than a badge on it, and a count nobody can
 * open is exactly a badge.
 */
export function ToolInventory({
  tools = workbenchTools,
  offline = false,
  className,
}: {
  /**
   * Which tools this panel is standing next to. Defaults to the bench's six
   * because that is where this header was born, but the count is a claim about
   * the *current* screen — left hardcoded it told the workspace screen that six
   * tools were available there when none were registered at all.
   */
  tools?: readonly AgentTool[];
  /**
   * Whether anything is actually holding this list.
   *
   * `7 tools available` printed beside `Agent not connected` is the panel
   * contradicting itself in one line: with no host, nothing is registered and
   * nothing can call them. The list is still worth showing — it is what this
   * page *offers* — so the count stays and the sentence changes.
   */
  offline?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  const toolPurpose = toolPurposes(copy);

  return (
    <Popover
      align="end"
      width="md"
      label={copy.agentPanel.tools.title}
      className={className}
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="text-caption text-ink-tertiary hover:text-ink-secondary decoration-border-strong underline decoration-dotted underline-offset-2 transition-colors"
        >
          {offline
            ? copy.status.toolsOnThisPage(tools.length)
            : copy.status.toolsAvailable(tools.length)}
        </button>
      )}
    >
      <MenuLabel>{copy.agentPanel.tools.title}</MenuLabel>
      <ul className="px-1 pb-1">
        {tools.map((tool) => (
          <li key={tool} className="px-2 py-1.5">
            <ToolBadge tool={tool} />
            <p className="text-caption text-ink-tertiary mt-0.5">
              {toolPurpose[tool]}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-caption text-ink-tertiary border-border border-t px-3 py-2">
        {copy.agentPanel.tools.note}
      </p>
    </Popover>
  );
}

export function AgentPanelHeader({
  pulse,
  tool,
  tools,
  className,
}: {
  pulse: PulseState;
  /** Shown, shimmering, while a call is in flight. */
  tool?: AgentTool;
  /** The tools this screen actually registers. */
  tools?: readonly AgentTool[];
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <AgentMark size={26} active={pulse === "working"} />
        <h2 className="text-h3 text-ink min-w-0 truncate">{brand.agentName}</h2>
        {/* `announce={false}`: this indicator is mounted for the life of the
            panel, and left announcing it reads every raw tool name aloud. The
            human sentence goes through the panel's one live region instead. */}
        <ActivityPulse
          state={pulse}
          tool={tool}
          announce={false}
          className="ml-auto"
        />
      </div>

      {/* Deliberately not `MetadataLine`: that renders a paragraph, and the
          tool inventory is a popover whose wrapper is a div. A div inside a p
          is invalid, and the browser silently closes the paragraph around it. */}
      <div className="text-caption text-ink-tertiary mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {pulse === "offline" ? null : (
          <>
            <span>{copy.status.connectedViaWebMcp}</span>
            <span aria-hidden="true" className="text-ink-disabled">
              ·
            </span>
          </>
        )}
        <ToolInventory tools={tools} offline={pulse === "offline"} />
      </div>
    </div>
  );
}

/**
 * G-13 · WebMCP unavailable
 *
 * The canonical rule-4 case, and a sibling of `You can continue in guided demo
 * mode`: its job is reassurance, and a warning-shaped box would undo that
 * whatever it said. Tone `info` rather than `warning` for the same reason — the
 * honest absence signal is the pulse going to its hollow ring, which is where
 * absence belongs. Here the product is explaining a browser limitation.
 */
export function WebMcpNotice({ className }: { className?: string }) {
  const copy = useCopy();

  return (
    <Alert
      tone="info"
      title={copy.agentPanel.webMcpUnavailable}
      className={className}
    >
      {copy.agentPanel.webMcpUnavailableDetail}
    </Alert>
  );
}

/**
 * G-14 · Suggested action
 *
 * Exactly one control. Two full-width buttons at rule 2's mandatory 16px gap
 * would spend a fifth of the panel's height on chrome, and "the action the agent
 * is proposing" stops meaning anything once there are two of them.
 *
 * The label changes; the capsule does not move. Keying the label makes the
 * change visible without the whole footer jumping, and because the foot's height
 * is fixed the scroll region never reflows under a finding you are reading.
 */
export function SuggestedAction({
  label,
  actionId,
  onAction,
  loading = false,
  disabled = false,
}: {
  label: string;
  /** Changing this replays the label transition. */
  actionId: string;
  onAction?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="primary"
      size="md"
      block
      loading={loading}
      disabled={disabled}
      onClick={onAction}
    >
      <span key={actionId} className="motion-expand">
        {label}
      </span>
    </Button>
  );
}

export function AgentPanel({
  pulse,
  tool,
  tools,
  webMcpAvailable = true,
  tab,
  onTabChange,
  findingCount = 0,
  action,
  announcement,
  className,
  children,
}: {
  pulse: PulseState;
  tool?: AgentTool;
  /** What this screen registers. Defaults to the bench's list. */
  tools?: readonly AgentTool[];
  webMcpAvailable?: boolean;
  tab: AgentTab;
  onTabChange: (next: AgentTab) => void;
  findingCount?: number;
  action?: {
    id: string;
    label: string;
    onAction?: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  /** Sentence for the panel's one live region. */
  announcement?: string;
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();
  const tabLabel = copy.agentPanel.tabs;

  return (
    <Panel
      ariaLabel={brand.agentName}
      className={cn("rounded-xl", className)}
      headerClassName="border-b-0 pb-0"
      bodyClassName="px-4 py-2.5"
      header={
        <div>
          {/* The list this screen actually hands the browser, not the bench's
              by default — the count is a claim about the current page, and it
              told the entry screen that six tools were available there when
              none were registered at all. */}
          <AgentPanelHeader pulse={pulse} tool={tool} tools={tools} />

          {!webMcpAvailable ? (
            <WebMcpNotice className="border-border -mx-4 mt-2 border-t px-4" />
          ) : null}

          <Tabs<AgentTab>
            id="agent-panel"
            className="-mx-4 mt-2 px-4"
            label={brand.agentName}
            size="sm"
            value={tab}
            onValueChange={onTabChange}
            items={[
              { value: "guidance", label: tabLabel.guidance },
              {
                value: "findings",
                label: tabLabel.findings,
                count: findingCount,
              },
              { value: "activity", label: tabLabel.activity },
            ]}
          />
        </div>
      }
      footer={
        action ? (
          <SuggestedAction
            label={action.label}
            actionId={action.id}
            onAction={action.onAction}
            loading={action.loading}
            disabled={action.disabled}
          />
        ) : undefined
      }
    >
      {children}
      {announcement ? <LiveRegion message={announcement} /> : null}
    </Panel>
  );
}

export { TabPanel };
