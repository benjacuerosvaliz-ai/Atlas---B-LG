import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** Where the wordmark links to. Pass null to render as plain non-link. */
  href?: string | null;
  /** Extra Tailwind classes on the outer wrapper. */
  className?: string;
  /** Show the "Atlas" subtitle next to the logo. Default true. */
  showAtlas?: boolean;
};

/**
 * Official BØLG brand wordmark + "Atlas" subtitle, used in every page
 * header. Uses the real `/public/bolg-wordmark.png` (white-on-transparent,
 * 883×516) so the brand identity is consistent everywhere instead of the
 * Inter Tight typographic placeholder we shipped early on.
 */
export function BolgWordmark({
  href = "/",
  className,
  showAtlas = true,
}: Props) {
  const inner = (
    <>
      <Image
        src="/bolg-wordmark.png"
        alt="BØLG"
        width={883}
        height={516}
        priority
        className="h-9 w-auto md:h-10"
      />
      {showAtlas && (
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/55">
          Atlas
        </span>
      )}
    </>
  );

  const wrapperCls = cn("flex items-center gap-3", className);

  if (!href) {
    return <div className={wrapperCls}>{inner}</div>;
  }

  return (
    <Link href={href} className={wrapperCls}>
      {inner}
    </Link>
  );
}
