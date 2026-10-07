import { motion } from "framer-motion";
import { Sparkles, Star, Github, Linkedin, Mail } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

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
            {/* Kept empty for spacing if needed */}
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
            <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-border hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href={`mailto:${portfolio.email}`} className="p-2 rounded-full border border-border hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
              <Mail className="h-5 w-5" />
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
