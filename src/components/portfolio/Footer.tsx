import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/60 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/70 shadow-md shadow-indigo-500/25 ring-1 ring-white/80">
              <img
                src={portfolio.avatar}
                alt={portfolio.name}
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {portfolio.brand}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {portfolio.roles.join(" · ")}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {portfolio.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {[
              { src: favicons.gmail, alt: "Email", href: `mailto:${portfolio.email}`, label: "Email" },
              {
                src: favicons.linkedin,
                alt: "LinkedIn",
                href: portfolio.linkedinUrl,
                label: "LinkedIn",
                external: true,
              },
            ].map(({ src, alt, href, label, external }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="glass-chip group grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
              >
                <Favicon src={src} alt={alt} size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-indigo-100/70 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} {portfolio.brand}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Crafted with care — {portfolio.firstName}
            <span className="text-primary">↗</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
