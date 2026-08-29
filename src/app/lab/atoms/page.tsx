import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import {
  BadgeSpecimens,
  ButtonSpecimens,
  ControlSpecimens,
  FeedbackSpecimens,
} from "@/components/lab/atoms/atoms-gallery";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.atoms.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function AtomsPage() {
  const copy = await getServerCopy();
  const t = copy.lab.atoms;

  const sections = [
    { id: "a-buttons", title: t.page.anchors.buttons },
    { id: "a-badges", title: t.page.anchors.badges },
    { id: "a-controls", title: t.page.anchors.controls },
    { id: "a-feedback", title: t.page.anchors.feedback },
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
          aria-label={t.page.navLabel}
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
          id="a-buttons"
          code="A-01 · A-02"
          title={t.sections.buttons.title}
          description={t.sections.buttons.description}
        >
          <ButtonSpecimens />
        </LabSection>

        <LabSection
          id="a-badges"
          code="A-03 → A-07 · A-19 · A-20"
          title={t.sections.badges.title}
          description={t.sections.badges.description}
        >
          <BadgeSpecimens />
        </LabSection>

        <LabSection
          id="a-controls"
          code="A-08 → A-14"
          title={t.sections.controls.title}
          description={t.sections.controls.description}
        >
          <ControlSpecimens />
        </LabSection>

        <LabSection
          id="a-feedback"
          code="A-15 → A-18 · A-21 · A-22"
          title={t.sections.feedback.title}
          description={t.sections.feedback.description}
        >
          <FeedbackSpecimens />
        </LabSection>
      </div>
    </div>
  );
}
