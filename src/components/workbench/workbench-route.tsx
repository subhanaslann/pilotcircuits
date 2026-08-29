"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBuild } from "@/components/build/build-provider";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { workbenchTools } from "@/lib/agent/model";
import { Workbench } from "@/components/workbench/live-workbench";

/**
 * S-04 · The workbench, mounted against the build the product is carrying.
 *
 * Three things this does that the component below it must not:
 *
 * **It fills the viewport.** `h-dvh` rather than `h-screen`, because on a
 * phone the browser chrome moves and `100vh` is the height the page had before
 * it did — and the whole frame below depends on knowing exactly how tall it is.
 * `min-h-0` because the body is a flex column: without it this child would
 * refuse to shrink below its content and the page would grow a second
 * scrollbar behind a screen that already scrolls in four places.
 *
 * **It starts the clock.** A person who types this URL has started the build
 * just as much as one who pressed `Start build` on the project page. The action
 * is idempotent, so arriving from either direction is one start.
 *
 * **It hands the browser the six tools that can act here.** §9 keeps a tool on
 * the page that can honour it, and every one of these moves something on this
 * screen.
 *
 * **It hands over the canvas handles.** They belong to the provider, so the
 * agent's focus outlives this mount — and when the person walks to the summary,
 * React writes `null` back into them and the effects that would have moved a
 * camera quietly find nothing to move.
 */
export function WorkbenchRoute({ slug }: { slug: string }) {
  const router = useRouter();
  const { session, canvasRef, cameraRef } = useBuild();

  useWebMcpTools(workbenchTools);

  /* Once per arrival. `start` is a plain function rather than a `useCallback`
     (this project compiles with the React Compiler), so listing it as a
     dependency would run this on every render; the action is idempotent, but a
     dispatch per frame is not something to lean on. */
  useEffect(() => {
    session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col">
      <Workbench
        session={session}
        canvas={canvasRef}
        camera={cameraRef}
        backHref={`/projects/${slug}`}
        onFinish={() => router.push(`/complete/${slug}`)}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
