"use client";

import { Check, Languages } from "lucide-react";
import { MenuItem, MenuLabel, Popover } from "@/components/ui/overlay";
import { useLocale } from "@/content/copy-provider";
import { localeCodes, localeNames, locales } from "@/content/i18n";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * F-10 · Language switcher.
 *
 * A popover rather than a segmented control: two languages fit in a segment,
 * six do not, and the control should not have to be redesigned the day a third
 * one lands.
 *
 * Every language is written in its own language and never translated — someone
 * looking for Türkçe is not looking for the word "Turkish". For the same reason
 * the trigger shows the code (`TR`) rather than a flag: a flag is a country,
 * and a language is not one.
 */
export function LocaleSelect({
  tone = "chip",
  className,
}: {
  /**
   * S-01 · the same control on a surface with no chips on it.
   *
   * The workshop nameplate carries a wide wordmark, one nav item and a status
   * light; a raised white capsule between them would be a third object
   * competing with the two that matter. `bare` keeps every behaviour and drops
   * the shell — two letters in the same condensed face as the nav item beside
   * it, which is what a setting looks like on an instrument.
   */
  tone?: "chip" | "bare";
  className?: string;
}) {
  const { locale, setLocale } = useLocale();

  return (
    <Popover
      align="end"
      width="sm"
      label={localeNames[locale]}
      className={className}
      trigger={({ open, toggle }) =>
        tone === "bare" ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={localeNames[locale]}
            className={cn(
              "font-condensed duration-instant inline-flex items-center text-[14px] leading-none font-semibold tracking-[0.045em] uppercase transition-colors",
              open ? "text-accent-active" : "text-ink-tertiary hover:text-ink",
            )}
          >
            {localeCodes[locale]}
          </button>
        ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label={localeNames[locale]}
          className={cn(
            "text-caption inline-flex h-7 items-center gap-1.5 rounded-full pr-2.5 pl-2 font-medium transition-all duration-instant ease-out-soft",
            open
              ? "bg-accent-soft text-accent-active shadow-chip-selected"
              : "bg-surface text-ink-secondary shadow-badge hover:text-ink hover:shadow-btn-surface-lift",
          )}
        >
          <Languages
            size={icon.xs}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
          />
          <span className="text-mono-sm font-mono">{localeCodes[locale]}</span>
        </button>
        )
      }
    >
      {({ close }) => (
        <>
          <MenuLabel>{localeNames[locale]}</MenuLabel>
          {locales.map((option) => (
            <MenuItem
              key={option}
              icon={
                option === locale ? (
                  <Check
                    size={icon.xs}
                    strokeWidth={icon.strokeWidth}
                    className="text-accent"
                  />
                ) : (
                  <span className="block size-3.5" />
                )
              }
              onClick={() => {
                setLocale(option);
                close();
              }}
            >
              {localeNames[option]}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}
