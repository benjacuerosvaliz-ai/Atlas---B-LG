import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** Where the wordmark links to. Pass null to render as plain non-link. */
  href?: string | null;
  /** Extra Tailwind classes on the outer wrapper. */
  className?: string;
};

/**
 * Official BØLG brand wordmark, used in every page header. Uses
 * `/public/bolg-wordmark.png` (white-on-transparent, 883×516) so the
 * brand identity is consistent everywhere.
 *
 * The "Atlas" subtitle was removed — the product context is already
 * communicated by the URL and the surrounding UI; doubling it next to
 * the logo just added noise.
 */
export function BolgWordmark({ href = "/", className }: Props) {
  const inner = (
    <Image
      src="/bolg-wordmark.png"
      alt="BØLG"
      width={883}
      height={516}
      priority
      className="h-9 w-auto md:h-10"
    />
  );

  const wrapperCls = cn("flex items-center", className);

  if (!href) {
    return <div className={wrapperCls}>{inner}</div>;
  }

  return (
    <Link href={href} className={wrapperCls}>
      {inner}
    </Link>
  );
}
