import { useEffect, useState } from "react";
import { Link } from "react-router";
import { portfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Home, User, FileText, Briefcase, Mail, ChevronDown, Award, Linkedin, Github } from "lucide-react";

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
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:static lg:px-0 lg:pt-0 lg:w-64 lg:shrink-0 lg:block">
      <div className="lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)]">
        <nav
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-3xl px-4 py-3 transition-all duration-300 sm:px-5 lg:mx-0 lg:h-full lg:flex-col lg:items-start lg:justify-start lg:gap-6 lg:w-full lg:p-6 lg:pb-8",
            scrolled || open ? "glass shadow-xl shadow-black/20 lg:shadow-none" : "glass lg:shadow-xl lg:shadow-black/20",
          )}
        >
          {/* Logo / Brand (Wait, image doesn't have avatar in sidebar, just links. Oh wait, it has Home, About, etc. But I'll keep the avatar/brand at top of sidebar or remove it?) The image doesn't have avatar in the sidebar. Let's keep it minimal if we want. Let's just keep our brand block. */}
          <a href="#home" className="group flex items-center gap-3 lg:mb-4 lg:hidden" onClick={close}>
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/70 shadow-md ring-1 ring-white/80 transition-transform duration-300 group-hover:scale-105">
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
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-col w-full gap-2 flex-1">
            {portfolio.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {getIcon(item.label)}
                {item.label}
              </a>
            ))}
            <Link
              to="/credentials"
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <Award className="w-4 h-4" />
              Certificates
            </Link>
          </div>

          {/* Desktop Footer / Socials */}
          <div className="hidden lg:flex flex-wrap items-center gap-2 mt-auto w-full justify-start pl-2">
            <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full glass-chip hover:bg-white/10 transition-colors text-foreground">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href={`mailto:${portfolio.email}`} className="grid h-10 w-10 place-items-center rounded-full glass-chip hover:bg-white/10 transition-colors text-foreground">
              <Mail className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile top-bar icons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-foreground"
            >
              <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {open && (
          <div className="mx-auto mt-2 max-w-6xl md:hidden">
            <div className="glass rounded-2xl p-2 shadow-xl shadow-black/20">
              {portfolio.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/10"
                >
                  {getIcon(item.label)}
                  {item.label}
                </a>
              ))}
              <Link
                to="/credentials"
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-white/10"
              >
                <Award className="w-4 h-4" />
                Certificates
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
