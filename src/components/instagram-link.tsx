/**
 * Branded Instagram link. lucide-react v1.x dropped brand icons for
 * trademark reasons, so the camera glyph is inlined here. Renders as a
 * compact pill with Instagram's official gradient so visitors instantly
 * recognise it as a link to the user's IG profile (vs. a plain "@handle"
 * which is easy to scroll past).
 */

import { ArrowUpRight } from "lucide-react";

type Props = {
  handle: string;
  /** Compact = no trailing arrow; useful in dense headers. Default false. */
  compact?: boolean;
};

export function InstagramLink({ handle, compact = false }: Props) {
  const cleaned = handle.replace(/^@/, "");
  return (
    <a
      href={`https://instagram.com/${cleaned}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver Instagram de @${cleaned}`}
      className="group inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
    >
      <InstagramGlyph className="h-3.5 w-3.5 shrink-0" />
      <span>@{cleaned}</span>
      {!compact && (
        <ArrowUpRight
          className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      )}
    </a>
  );
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
