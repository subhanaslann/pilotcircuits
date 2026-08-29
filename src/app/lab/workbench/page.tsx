import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { TopbarSpecimen } from "@/components/lab/workbench/topbar-specimen";
import { RailSpecimen } from "@/components/lab/workbench/rail-specimen";
import { LayoutStage } from "@/components/lab/workbench/layout-stage";
import { CameraDirections } from "@/components/lab/workbench/camera-directions";
import { InspectionSpecimen } from "@/components/lab/workbench/inspection-specimen";
import { DemoSpecimen } from "@/components/lab/workbench/demo-specimen";
import { SmallScreenSpecimen } from "@/components/lab/workbench/small-screen";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.workbenchLab.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function WorkbenchPage() {
  const copy = await getServerCopy();
  const t = copy.lab.workbenchLab;

  const sections = [
    { id: "w-topbar", title: t.topbar.title },
    { id: "w-rail", title: t.rail.title },
    { id: "w-layout", title: t.layout.title },
    { id: "w-camera", title: t.camera.title },
    { id: "w-inspection", title: t.inspection.title },
    { id: "w-demo", title: t.demo.title },
    { id: "w-small", title: t.small.title },
  ];

  /* Wider than the other lab pages on purpose: the material under review is a
     1440-wide screen, and a stage the column has to scroll sideways is a layout
     nobody can judge in one look. The prose keeps its own measure. */
  return (
    <div className="mx-auto max-w-[1512px] px-8 py-10">
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
          id="w-topbar"
          code="W-01"
          title={t.topbar.title}
          description={t.topbar.description}
        >
          <TopbarSpecimen />
        </LabSection>

        <LabSection
          id="w-rail"
          code="W-02 · W-03"
          title={t.rail.title}
          description={t.rail.description}
        >
          <RailSpecimen />
        </LabSection>

        <LabSection
          id="w-layout"
          code="W-04"
          title={t.layout.title}
          description={t.layout.description}
        >
          <LayoutStage />
        </LabSection>

        <LabSection
          id="w-camera"
          code="W-06 · W-07"
          title={t.camera.title}
          description={t.camera.description}
        >
          <CameraDirections />
        </LabSection>

        <LabSection
          id="w-inspection"
          code="W-05 · W-08 · W-09"
          title={t.inspection.title}
          description={t.inspection.description}
        >
          <InspectionSpecimen />
        </LabSection>

        <LabSection
          id="w-demo"
          code="W-10"
          title={t.demo.title}
          description={t.demo.description}
        >
          <DemoSpecimen />
        </LabSection>

        <LabSection
          id="w-small"
          code="W-11"
          title={t.small.title}
          description={t.small.description}
        >
          <SmallScreenSpecimen />
        </LabSection>
      </div>
    </div>
  );
}
