import { cn } from "@/lib/utils";

// Small browser-tab style favicon image. Use local site favicons
// (/bimi-logo.svg, /majesty-avatar.jpg) for generic icons and
// Google S2 favicons for real brand domains to avoid AI-generic Lucide look.
export function Favicon({
  src,
  alt,
  size = 16,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn(
        "shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size }}
      onError={(e) => {
        // Fallback to site favicon if external favicon fails
        const target = e.currentTarget as HTMLImageElement;
        if (target.src !== window.location.origin + "/bimi-logo.svg") {
          target.src = "/bimi-logo.svg";
        }
      }}
    />
  );
}

// Predefined favicons — keeps site offline-friendly but uses real brand favicons where it matters.
export const favicons = {
  site: "/bimi-logo.svg", // Majesty's M — generic fallback, looks like a real tab favicon
  avatar: "/majesty-avatar.jpg",
  linkedin: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=64",
  gmail: "https://www.google.com/s2/favicons?domain=mail.google.com&sz=64",
  github: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
  figma: "https://www.google.com/s2/favicons?domain=figma.com&sz=64",
  vercel: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
  coursera: "https://www.google.com/s2/favicons?domain=coursera.org&sz=64",
  google: "https://www.google.com/s2/favicons?domain=google.com&sz=64",
  calendar: "https://www.google.com/s2/favicons?domain=calendar.google.com&sz=64",
  maps: "https://www.google.com/s2/favicons?domain=maps.google.com&sz=64",
} as const;
