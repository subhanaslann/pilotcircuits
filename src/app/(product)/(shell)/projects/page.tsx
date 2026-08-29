import type { Metadata } from "next";
import { ProjectLibrary } from "@/components/library/project-library";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerCopy()).library.title };
}

/**
 * S-02 · `/projects` — Project library.
 *
 * The heading and the line under it are server-rendered so they arrive in the
 * reader's language on the first paint; the toolbar and the grid are one client
 * island below, because filtering is a conversation rather than a page load.
 */
export default async function ProjectsPage() {
  const copy = await getServerCopy();

  return (
    <main className="pt-10 pb-20">
      <h1 className="text-h1 text-ink">{copy.library.title}</h1>
      <p className="text-body text-ink-secondary mt-2 max-w-prose">
        {copy.library.intro}
      </p>

      <div className="mt-8">
        <ProjectLibrary />
      </div>
    </main>
  );
}
