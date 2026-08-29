import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { LiveDock } from "@/components/lab/device/live-dock";
import { DockShell } from "@/components/lab/device/dock-shell";
import { SerialTelemetry } from "@/components/lab/device/serial-telemetry";
import { TestOutputSpecimens } from "@/components/lab/device/test-output";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.deviceLab.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function DevicePage() {
  const copy = await getServerCopy();
  const t = copy.lab.deviceLab;

  const sections = [
    { id: "d-live", title: t.live.title },
    { id: "d-dock", title: t.dock.title },
    { id: "d-serial", title: t.serial.title },
    { id: "d-test", title: t.test.title },
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
          id="d-live"
          code="D-01 → D-07"
          title={t.live.title}
          description={t.live.description}
        >
          <LiveDock />
        </LabSection>

        <LabSection
          id="d-dock"
          code="D-01 · D-02 · D-07"
          title={t.dock.title}
          description={t.dock.description}
        >
          <DockShell />
        </LabSection>

        <LabSection
          id="d-serial"
          code="D-03 · D-04"
          title={t.serial.title}
          description={t.serial.description}
        >
          <SerialTelemetry />
        </LabSection>

        <LabSection
          id="d-test"
          code="D-05 · D-06"
          title={t.test.title}
          description={t.test.description}
        >
          <TestOutputSpecimens />
        </LabSection>
      </div>
    </div>
  );
}
