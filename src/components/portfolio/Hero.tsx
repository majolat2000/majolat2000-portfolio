import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Briefcase,
  Code2,
  Download,
  GraduationCap,
  Linkedin,
  Mail,
  Palette,
  Phone,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

function FloatBadge({
  className,
  icon: Icon,
  label,
  delay = 0,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn("absolute z-10 hidden lg:block", className)}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className="glass-deep flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-foreground/85 shadow-lg shadow-indigo-500/10">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
    </motion.div>
  );
}

function ContactChip({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="glass-chip group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pb-24 pt-36 sm:pb-32 lg:pb-36 lg:pt-44"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Open to internships &amp; opportunities
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
            className="mt-6 font-display text-5xl leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Hi, I&apos;m{" "}
            <span className="text-gradient italic">Majesty</span>
            <span className="block">Olatimilehin</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            {portfolio.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get in touch
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#about"
              className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              About me
            </a>
            {portfolio.resumeUrl ? (
              <a
                href={portfolio.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-chip inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
              >
                <Download className="h-4 w-4 text-primary" />
                Resume
              </a>
            ) : (
              <span
                title="Resume link coming soon"
                className="glass-chip inline-flex cursor-default items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground/55"
              >
                <Download className="h-4 w-4" />
                Resume
                <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Soon
                </span>
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <ContactChip
              href={portfolio.linkedinUrl}
              icon={Linkedin}
              label="LinkedIn"
            />
            <ContactChip
              href={`mailto:${portfolio.email}`}
              icon={Mail}
              label="Email"
            />
            <ContactChip href={`tel:${portfolio.phoneTel}`} icon={Phone} label="Phone" />
          </motion.div>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          <div className="glass relative overflow-hidden rounded-[2.25rem] p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-300/40 blur-2xl" />
            <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-indigo-300/30 blur-2xl" />

            <div className="relative">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-400 to-sky-400 font-display text-4xl font-semibold text-white shadow-xl shadow-indigo-500/30 ring-4 ring-white/70">
                {portfolio.initials}
              </div>
              <h3 className="mt-6 text-center font-display text-2xl font-semibold text-foreground">
                {portfolio.name}
              </h3>
              <p className="mt-1.5 text-center text-sm font-semibold text-primary">
                {portfolio.roles.join("  ·  ")}
              </p>

              <div className="my-6 h-px bg-gradient-to-r from-transparent via-indigo-200/80 to-transparent" />

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Code2, label: "Computer Science" },
                  { icon: Briefcase, label: "Virtual Assistant" },
                  { icon: Sparkles, label: "Always learning" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white/55 px-2 py-3 text-center shadow-sm backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-semibold leading-tight text-foreground/70">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <FloatBadge
            className="-left-16 top-10"
            icon={Palette}
            label="Artist's eye"
            delay={0.2}
          />
          <FloatBadge
            className="-right-12 top-1/3"
            icon={Zap}
            label="Fast learner"
            delay={1}
          />
          <FloatBadge
            className="-left-14 bottom-24"
            icon={GraduationCap}
            label="CS student"
            delay={1.8}
          />
          <FloatBadge
            className="-right-10 bottom-8"
            icon={Star}
            label="Detail-focused"
            delay={0.7}
          />
        </motion.div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to about section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground/70 transition-colors hover:text-foreground lg:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
          Scroll
        </span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </motion.a>
    </section>
  );
}
