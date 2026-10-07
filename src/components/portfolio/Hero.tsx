import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Favicon, favicons } from "@/components/ui/favicon";

function FloatBadge({
  className,
  src,
  alt,
  label,
  delay = 0,
}: {
  className?: string;
  src: string;
  alt: string;
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
        <Favicon src={src} alt={alt} size={16} />
        {label}
      </div>
    </motion.div>
  );
}

function ContactChip({
  href,
  src,
  alt,
  label,
}: {
  href: string;
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="glass-chip group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
    >
      <Favicon src={src} alt={alt} size={16} />
      {label}
      <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        ↗
      </span>
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
            {/* Kept empty for spacing if needed, removing the open to work badge to match reference */}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
            className="font-display text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-foreground sm:text-[4.5rem] lg:text-[5.5rem]"
          >
            {portfolio.brand}
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
            className="mt-1 text-2xl font-bold text-foreground sm:text-3xl"
          >
            {portfolio.name}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
            className="mt-3 flex items-center text-base sm:text-lg text-foreground/90 font-medium"
          >
            I'm a&nbsp;<span className="underline underline-offset-4 decoration-2">{portfolio.roles[0]}|</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.20, ease: "easeOut" }}
            className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            {portfolio.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#catalog"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full border border-border bg-transparent px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              Get In Touch
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: "easeOut" }}
            className="mt-8 flex items-center gap-4"
          >
            <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-border hover:bg-white/5 transition-colors">
              <Favicon src={favicons.linkedin} alt="LinkedIn" size={16} className="opacity-75 grayscale" />
            </a>
            <a href={`mailto:${portfolio.email}`} className="p-2 rounded-full border border-border hover:bg-white/5 transition-colors">
              <Favicon src={favicons.gmail} alt="Email" size={16} className="opacity-75 grayscale" />
            </a>
          </motion.div>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none flex items-center justify-center lg:justify-end"
        >
          <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[2.5rem] bg-card border border-border shadow-2xl">
            <img
              src={portfolio.photo || portfolio.avatar}
              alt={portfolio.name}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
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
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Scroll</span>
        <span className="animate-bounce text-lg leading-none">↓</span>
      </motion.a>
    </section>
  );
}
