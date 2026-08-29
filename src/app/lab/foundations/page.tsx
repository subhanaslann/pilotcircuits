import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { ColorTokens } from "@/components/lab/foundations/color-tokens";
import { WirePalette } from "@/components/lab/foundations/wire-palette";
import { Typography } from "@/components/lab/foundations/typography";
import { LayoutRhythm } from "@/components/lab/foundations/layout-rhythm";
import { SurfaceCraft } from "@/components/lab/foundations/surface-craft";
import { MotionTokens } from "@/components/lab/foundations/motion-tokens";
import { IconSystem } from "@/components/lab/foundations/icon-system";
import {
  ContentLayer,
  FocusRing,
} from "@/components/lab/foundations/focus-and-content";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getServerCopy();
  const t = copy.lab.foundations.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function FoundationsPage() {
  const copy = await getServerCopy();
  const t = copy.lab.foundations;

  /* Anchor pills. The title is read from the same key the section header
     renders, so a pill can never say something the heading below it does not. */
  const sections = [
    { id: "f-01", title: t.colour.title },
    { id: "f-02", title: t.wire.title },
    { id: "f-03", title: t.typography.title },
    { id: "f-04", title: t.layout.title },
    { id: "f-05", title: t.surface.title },
    { id: "f-07", title: t.motion.title },
    { id: "f-08", title: t.icons.title },
    { id: "f-09", title: t.focus.title },
    { id: "f-10", title: t.content.title },
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

        <nav
          aria-label={t.page.sectionsNav}
          className="mt-5 flex flex-wrap gap-1.5"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border-border bg-surface text-caption text-ink-secondary hover:bg-surface-hover hover:text-ink rounded-sm border px-2 py-1 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="space-y-14">
        <LabSection
          id="f-01"
          code="F-01 · F-06"
          title={t.colour.title}
          description={t.colour.description}
        >
          <ColorTokens />
        </LabSection>

        <LabSection
          id="f-02"
          code="F-02"
          title={t.wire.title}
          description={t.wire.description}
        >
          <WirePalette />
        </LabSection>

        <LabSection
          id="f-03"
          code="F-03"
          title={t.typography.title}
          description={t.typography.description}
        >
          <Typography />
        </LabSection>

        <LabSection
          id="f-04"
          code="F-04"
          title={t.layout.title}
          description={t.layout.description}
        >
          <LayoutRhythm />
        </LabSection>

        <LabSection
          id="f-05"
          code="F-05"
          title={t.surface.title}
          description={t.surface.description}
        >
          <SurfaceCraft />
        </LabSection>

        <LabSection
          id="f-07"
          code="F-07"
          title={t.motion.title}
          description={t.motion.description}
        >
          <MotionTokens />
        </LabSection>

        <LabSection
          id="f-08"
          code="F-08"
          title={t.icons.title}
          description={t.icons.description}
        >
          <IconSystem />
        </LabSection>

        <LabSection
          id="f-09"
          code="F-09"
          title={t.focus.title}
          description={t.focus.description}
        >
          <FocusRing />
        </LabSection>

        <LabSection
          id="f-10"
          code="F-10"
          title={t.content.title}
          description={t.content.description}
        >
          <ContentLayer />
        </LabSection>
      </div>
    </div>
  );
}
