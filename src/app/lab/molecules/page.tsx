import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import {
  ContainerSpecimens,
  NavigationSpecimens,
  OverlaySpecimens,
} from "@/components/lab/molecules/molecules-gallery";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getServerCopy();
  const t = copy.lab.molecules.page;
  return { title: `${t.eyebrow} · ${t.title}` };
}

export default async function MoleculesPage() {
  const copy = await getServerCopy();
  const t = copy.lab.molecules;

  const sections = [
    { id: "m-containers", title: t.sections.containers.pill },
    { id: "m-navigation", title: t.sections.navigation.pill },
    { id: "m-overlays", title: t.sections.overlays.pill },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-10">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.page.eyebrow}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.page.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.page.intro}
        </p>

        <nav
          aria-label={t.page.sectionsLabel}
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
          id="m-containers"
          code="M-01 · M-02 · M-13 · M-14"
          title={t.sections.containers.title}
          description={t.sections.containers.description}
        >
          <ContainerSpecimens />
        </LabSection>

        <LabSection
          id="m-navigation"
          code="M-03 · M-04 · M-15"
          title={t.sections.navigation.title}
          description={t.sections.navigation.description}
        >
          <NavigationSpecimens />
        </LabSection>

        <LabSection
          id="m-overlays"
          code="M-05 → M-12 · M-16 · M-17"
          title={t.sections.overlays.title}
          description={t.sections.overlays.description}
        >
          <OverlaySpecimens />
        </LabSection>
      </div>
    </div>
  );
}
