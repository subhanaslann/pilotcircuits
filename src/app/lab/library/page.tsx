import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { ProjectModel } from "@/components/lab/library/project-model";
import { ComponentMarks } from "@/components/lab/library/component-marks";
import { ProjectScenes } from "@/components/lab/library/project-scenes-block";
import { CardDirections } from "@/components/lab/library/card-directions";
import { LibraryBlocks } from "@/components/lab/library/library-blocks";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.libraryLab.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function LibraryPage() {
  const copy = await getServerCopy();
  const t = copy.lab.libraryLab;

  const sections = [
    { id: "p-model", title: t.model.title },
    { id: "p-icons", title: t.icons.title },
    { id: "p-scenes", title: t.scenes.title },
    { id: "p-cards", title: t.cards.title },
    { id: "p-blocks", title: t.blocks.title },
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
          id="p-model"
          code="catalog.ts"
          title={t.model.title}
          description={t.model.description}
        >
          <ProjectModel />
        </LabSection>

        <LabSection
          id="p-icons"
          code="P-06"
          title={t.icons.title}
          description={t.icons.description}
        >
          <ComponentMarks />
        </LabSection>

        <LabSection
          id="p-scenes"
          code="P-02 · P-09"
          title={t.scenes.title}
          description={t.scenes.description}
        >
          <ProjectScenes />
        </LabSection>

        <LabSection
          id="p-cards"
          code="P-01"
          title={t.cards.title}
          description={t.cards.description}
        >
          <CardDirections />
        </LabSection>

        <LabSection
          id="p-blocks"
          code="P-03 · P-04 · P-05 · P-07 · P-08 · P-10 · P-11"
          title={t.blocks.title}
          description={t.blocks.description}
        >
          <LibraryBlocks />
        </LabSection>
      </div>
    </div>
  );
}
