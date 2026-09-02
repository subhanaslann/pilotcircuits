"use client";

import {
  Activity,
  Circle,
  Minus,
  Plus,
  Target,
  TriangleAlert,
} from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { icon, wireRoles, type WireRoleSpec } from "@/lib/design/tokens";

type Wire = (typeof foundations)["en"]["wire"];

const iconFor = {
  Plus,
  Minus,
  Activity,
  TriangleAlert,
  Target,
  Circle,
} as const;

const order: WireRoleSpec[] = [
  wireRoles.power,
  wireRoles.ground,
  wireRoles.signal,
  wireRoles.signalAlt,
  wireRoles.servoSignal,
  wireRoles.servoGround,
  wireRoles.error,
  wireRoles.target,
  wireRoles.idle,
];

const SPECIMEN = "M4 20 C 34 20, 34 8, 64 8 S 98 8, 128 8";

/** A short specimen of the exact stroke stack the canvas will draw. */
function WireSample({ role, muted }: { role: WireRoleSpec; muted?: boolean }) {
  const body = muted ? "#8a8a8a" : role.hex;
  const edge = muted ? "#606060" : role.edgeHex;
  /* A dashed role is an annotation, not a cable — it gets no rim and no plugs,
     because there is nothing physically there to give volume to. */
  const cable = !role.dash;

  return (
    <svg
      viewBox="0 0 132 28"
      className="h-7 w-[132px] shrink-0"
      aria-hidden="true"
    >
      {cable ? (
        <path
          d={SPECIMEN}
          fill="none"
          stroke={edge}
          strokeWidth={role.width * 1.4}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={SPECIMEN}
        fill="none"
        stroke={body}
        strokeWidth={role.width}
        strokeLinecap="round"
        strokeDasharray={role.dash}
      />
      {cable
        ? [
            [4, 20],
            [128, 8],
          ].map(([cx, cy]) => (
            <rect
              key={cx}
              x={cx - 3.1}
              y={cy - 5.75}
              width={6.2}
              height={11.5}
              rx={1.6}
              fill={muted ? "#4a4a4a" : "#2f3742"}
            />
          ))
        : null}
    </svg>
  );
}

export function WirePalette() {
  const copy = useCopy();
  const t: Wire = copy.lab.foundations.wire;

  return (
    <>
      <LabBlock title={t.roles.title} note={t.roles.note}>
        <LabStage className="p-0">
          <table className="w-full">
            <caption className="sr-only">{t.roles.caption}</caption>
            <thead>
              <tr className="border-border text-overline text-ink-tertiary border-b text-left uppercase">
                <th className="px-5 py-2.5 font-semibold">
                  {t.columns.sample}
                </th>
                <th className="px-3 py-2.5 font-semibold">{t.columns.label}</th>
                <th className="px-3 py-2.5 font-semibold">
                  {t.columns.meaning}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {t.columns.stroke}
                </th>
                <th className="px-5 py-2.5 font-semibold">{t.columns.token}</th>
              </tr>
            </thead>
            <tbody>
              {order.map((role) => {
                const RoleIcon =
                  iconFor[role.icon as keyof typeof iconFor] ?? Circle;
                return (
                  <tr
                    key={role.id}
                    className="border-border/70 border-b last:border-0"
                  >
                    <td className="px-5 py-2.5">
                      <WireSample role={role} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-body-sm text-ink inline-flex items-center gap-1.5 font-medium">
                        <RoleIcon
                          size={icon.xs}
                          strokeWidth={icon.strokeWidth}
                          style={{ color: role.hex }}
                          aria-hidden="true"
                        />
                        {copy.wire.label[role.id]}
                      </span>
                    </td>
                    <td className="text-body-sm text-ink-secondary px-3 py-2.5">
                      {copy.wire.meaning[role.id]}
                    </td>
                    <td className="text-mono-sm text-ink-tertiary tnum px-3 py-2.5 font-mono">
                      {role.width}px{" "}
                      {role.dash
                        ? `· ${t.strokeDash} ${role.dash}`
                        : `· ${t.strokeSolid}`}
                    </td>
                    <td className="text-mono-sm text-ink-tertiary px-5 py-2.5 font-mono uppercase">
                      {role.hex}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.desaturated.title} note={t.desaturated.note}>
        <LabStage>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-4">
            {order.map((role) => (
              <div key={role.id} className="flex items-center gap-2">
                <WireSample role={role} muted />
                <span className="text-caption text-ink-secondary">
                  {copy.wire.label[role.id]}
                </span>
              </div>
            ))}
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
