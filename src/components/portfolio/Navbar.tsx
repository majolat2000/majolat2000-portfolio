import { useEffect, useState } from "react";
import { Link } from "react-router";
import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5",
          scrolled || open ? "glass-deep shadow-xl shadow-indigo-500/10" : "glass",
        )}
      >
        <a href="#home" className="group flex items-center gap-3" onClick={close}>
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/70 shadow-md shadow-indigo-500/25 ring-1 ring-white/80 transition-transform duration-300 group-hover:scale-105">
            <img
              src={portfolio.avatar}
              alt={portfolio.name}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-[15px] font-semibold leading-none text-foreground">
              {portfolio.brand}
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {portfolio.roles.join(" · ")}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {portfolio.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/70 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/credentials"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-white/70"
          >
            <Favicon src={favicons.coursera} alt="Certificates" size={16} />
            Certificates
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`mailto:${portfolio.email}`}
            className="hidden items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg sm:inline-flex"
          >
            Hire me
            <span>↗</span>
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="glass-chip grid h-10 w-10 place-items-center rounded-xl text-foreground md:hidden"
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl md:hidden">
          <div className="glass-deep rounded-2xl p-2 shadow-xl shadow-indigo-500/10">
            {portfolio.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/70"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/credentials"
              onClick={close}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/70"
            >
              <Favicon src={favicons.coursera} alt="Certificates" size={16} />
              Certificates &amp; achievements
            </Link>
            <a
              href={`mailto:${portfolio.email}`}
              onClick={close}
              className="mt-1 block rounded-xl bg-foreground px-4 py-3 text-center text-sm font-semibold text-background"
            >
              Hire me
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
