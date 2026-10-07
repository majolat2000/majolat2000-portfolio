import { useEffect, useState } from "react";
import { Link } from "react-router";
import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { cn } from "@/lib/utils";
import { Home, User, FileText, Briefcase, Mail, ChevronDown } from "lucide-react";

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

  // Icon mapping for navigation links based on labels from SnapFolio design
  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("home")) return <Home className="w-4 h-4" />;
    if (l.includes("about")) return <User className="w-4 h-4" />;
    if (l.includes("resume") || l.includes("experience")) return <FileText className="w-4 h-4" />;
    if (l.includes("portfolio") || l.includes("catalog") || l.includes("project")) return <Briefcase className="w-4 h-4" />;
    if (l.includes("contact")) return <Mail className="w-4 h-4" />;
    return <ChevronDown className="w-4 h-4" />; // Default/Dropdown
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-72 lg:px-6 lg:py-6 lg:h-screen lg:flex lg:flex-col">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 lg:mx-0 lg:h-full lg:flex-col lg:items-start lg:justify-start lg:gap-8 lg:w-full lg:p-6",
          scrolled || open ? "glass-deep shadow-xl shadow-indigo-500/10 lg:shadow-none" : "glass lg:glass-deep lg:shadow-xl lg:shadow-indigo-500/10",
        )}
      >
        <a href="#home" className="group flex items-center gap-3 lg:mb-4" onClick={close}>
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
              {portfolio.roles[0]}
            </span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-col w-full gap-2 flex-1">
          {portfolio.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/70 hover:text-foreground"
            >
              {getIcon(item.label)}
              {item.label}
            </a>
          ))}
          <Link
            to="/credentials"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/70"
          >
            <Favicon src={favicons.coursera} alt="Certificates" size={16} />
            Certificates
          </Link>
          <a
            href="#contact"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/70 hover:text-foreground"
          >
            {getIcon("Contact")}
            Contact
          </a>
        </div>

        <div className="hidden lg:flex flex-wrap items-center gap-3 mt-auto pt-8 border-t border-border/50 w-full justify-center">
          <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full glass-chip hover:bg-white/70 transition-colors">
            <Favicon src={favicons.linkedin} alt="LinkedIn" size={18} />
          </a>
          <a href={`mailto:${portfolio.email}`} className="p-2 rounded-full glass-chip hover:bg-white/70 transition-colors">
            <Favicon src={favicons.gmail} alt="Email" size={18} />
          </a>
        </div>

        {/* Mobile top-bar icons */}
        <div className="flex items-center gap-2 lg:hidden">
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

      {/* Mobile Menu */}
      {open && (
        <div className="mx-auto mt-2 max-w-6xl md:hidden">
          <div className="glass-deep rounded-2xl p-2 shadow-xl shadow-indigo-500/10">
            {portfolio.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/70"
              >
                {getIcon(item.label)}
                {item.label}
              </a>
            ))}
            <Link
              to="/credentials"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/70"
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
