"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useAgentSession,
  type AgentSession,
} from "@/components/agent/use-agent-session";

/**
 * S-01 · The entry screen's own session.
 *
 * Four surfaces on this screen describe one build: the sheet counts its open
 * findings, the terminal prints what the agent has done to it, the bench draws
 * it, and the panel drives it. They have to be reading the same thing, or the
 * screen contradicts itself in public — the sheet saying `YEŞİL` beside a
 * timeline reporting a mismatch is exactly the failure the whole page is an
 * argument against.
 *
 * ## Why not the product's session
 *
 * `build-provider.tsx` states the rule for the design lab and it holds harder
 * here: *playing with the live workbench must not move the build the product is
 * carrying.* Pressing `Kabloyu düzelt` on a marketing screen must not leave a
 * corrected — or half-corrected — build waiting at `/workbench`. So this is a
 * second session, deliberately, and it dies with the page.
 *
 * It opens on `defaultBuild`, which is the build `featuredProjectId` puts on
 * this screen, so the two cannot be talking about different things.
 *
 * The shared components take a session as a prop or read it from here; none of
 * them knows or cares which session it got. That was already true of
 * `AgentWorkspace` — this only extends it to the strip.
 */
const LandingSession = createContext<AgentSession | null>(null);

export function LandingSessionProvider({ children }: { children: ReactNode }) {
  const session = useAgentSession();
  return (
    <LandingSession.Provider value={session}>
      {children}
    </LandingSession.Provider>
  );
}

export function useLandingSession(): AgentSession {
  const session = useContext(LandingSession);
  if (!session) {
    throw new Error("useLandingSession outside LandingSessionProvider");
  }
  return session;
}
