import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be taught the project's own scales.
 *
 * Without this it reads `text-body-sm` as a *colour* utility (it cannot tell a
 * custom font-size token from a custom colour token), decides it conflicts with
 * `text-ink-inverse`, and silently drops the colour — which is how the primary
 * button ended up with dark text on a blue fill. Declaring the font-size group
 * keeps size and colour in separate lanes.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "overline",
            "mono-lg",
            "mono",
            "mono-sm",
          ],
        },
      ],
    },
  },
});

/** Conditional class names with later Tailwind utilities winning conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
