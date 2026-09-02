import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { PanelSpecimens } from "@/components/lab/agent/panel-specimens";
import { CoachSpecimens } from "@/components/lab/agent/coach-specimens";
import { GuidanceSpecimens } from "@/components/lab/agent/guidance-specimens";
import { FindingSpecimens } from "@/components/lab/agent/finding-specimens";
import { ActivitySpecimens } from "@/components/lab/agent/activity-specimens";
import { LiveSession } from "@/components/lab/agent/live-session";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.agentLab.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function AgentPage() {
  const copy = await getServerCopy();
  const t = copy.lab.agentLab;

  /* The pills and the section headers are the same five names, from the same
     five keys, so they cannot drift apart in either language. */
  const sections = [
    { id: "g-live", title: t.live.title },
    { id: "g-panel", title: t.panel.title },
    { id: "g-coach", title: t.coach.title },
    { id: "g-guidance", title: t.guidance.title },
    { id: "g-findings", title: t.findings.title },
    { id: "g-activity", title: t.activity.title },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-10">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.page.overline}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.page.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.page.intro}
        </p>
        <p className="text-body-sm text-ink-secondary mt-3 max-w-prose">
          {t.page.ruleLead}
          <em>{t.page.ruleEmphasis}</em>
          {t.page.ruleRest}
        </p>

        <nav
          aria-label={t.page.sectionsNav}
          className="mt-5 flex flex-wrap gap-1.5"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border-border bg-surface text-caption text-ink-secondary hover:bg-surface-hover hover:text-ink rounded-full border px-2.5 py-1 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="space-y-14">
        <LabSection
          id="g-live"
          code="G-01 → G-15"
          title={t.live.title}
          description={t.live.description}
        >
          <LiveSession />
        </LabSection>

        <LabSection
          id="g-panel"
          code="G-01 · G-02 · G-13 · G-14 · G-15"
          title={t.panel.title}
          description={t.panel.description}
        >
          <PanelSpecimens />
        </LabSection>

        <LabSection
          id="g-coach"
          code="G-16"
          title={t.coach.title}
          description={t.coach.description}
        >
          <CoachSpecimens />
        </LabSection>

        <LabSection
          id="g-guidance"
          code="G-03 · G-04 · G-08 · G-12"
          title={t.guidance.title}
          description={t.guidance.description}
        >
          <GuidanceSpecimens />
        </LabSection>

        <LabSection
          id="g-findings"
          code="G-05 · G-06 · G-07"
          title={t.findings.title}
          description={t.findings.description}
        >
          <FindingSpecimens />
        </LabSection>

        <LabSection
          id="g-activity"
          code="G-09 · G-10 · G-11"
          title={t.activity.title}
          description={t.activity.description}
        >
          <ActivitySpecimens />
        </LabSection>
      </div>
    </div>
  );
}
