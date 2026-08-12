import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router";
import { Background } from "@/components/portfolio/Background";
import { CertificateSlideshow } from "@/components/portfolio/CertificateSlideshow";
import { Footer } from "@/components/portfolio/Footer";
import { Reveal } from "@/components/portfolio/Reveal";
import { Section } from "@/components/portfolio/Section";
import { portfolio, type AchievementItem } from "@/lib/portfolio";

const NAV_LINKS = [
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Catalog", href: "/#catalog" },
  { label: "Contact", href: "/#contact" },
];

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 shadow-lg shadow-indigo-500/10 sm:px-5">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/70 shadow-md shadow-indigo-500/25 ring-1 ring-white/80 transition-transform duration-300 group-hover:scale-105">
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
              Certificates &amp; Achievements
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/70 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link
          to="/"
          className="glass-chip group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-0.5" />
          Back home
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-36 sm:pb-20 lg:pt-44">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {portfolio.firstName}&apos;s public proof of work
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          Certificates &amp;{" "}
          <span className="text-gradient italic">achievements</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
          className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          A growing collection of the certificates, honours and milestones
          I&apos;ve earned along the way — proof of the learning that never
          stops. New entries land here as I earn them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80">
            <BookOpenCheck className="h-4 w-4 text-primary" />
            {portfolio.certificates.length} certificate entries
          </span>
          <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80">
            <Trophy className="h-4 w-4 text-primary" />
            {portfolio.achievements.length} achievements
          </span>
          <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80">
            <GraduationCap className="h-4 w-4 text-primary" />
            First Class standing
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function CertificatesSection() {
  return (
    <Section
      id="certificates"
      eyebrow="Certificates"
      title={
        <>
          Proof of <span className="text-gradient italic">learning</span>
        </>
      }
      description="Certificates and course completions I've earned — from academia to professional skills training. Swipe to browse, or let it play."
    >
      <CertificateSlideshow items={portfolio.certificates} />
    </Section>
  );
}

function AchievementsSection() {
  return (
    <Section
      id="achievements"
      eyebrow="Achievements"
      title={
        <>
          Milestones I&apos;m <span className="text-gradient italic">proud of</span>
        </>
      }
      description="Honours and moments worth celebrating — academic, professional and community-driven."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {portfolio.achievements.map((item, i) => (
          <Reveal key={item.id} delay={Math.min(i, 5) * 0.06} className="h-full">
            <div className="glass group relative h-full overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-200/30 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Trophy className="h-5 w-5" />
                  </span>
                  {item.meta && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground/70 ring-1 ring-white/80">
                      <CalendarDays className="h-3 w-3 text-primary" />
                      {item.meta}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function CtaSection() {
  return (
    <Section id="cta" className="pb-28 sm:pb-32">
      <Reveal>
        <div className="glass-deep relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-300/35 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/25">
              <Medal className="h-6 w-6" />
            </span>
            <h2 className="mt-6 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
              Want the full <span className="text-gradient italic">picture?</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Head back to the home page to explore my experience, education and
              the full searchable catalog — or reach out directly.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to home
              </Link>
              <a
                href="/#contact"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get in touch
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export default function Credentials() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      <Background />
      <Header />
      <main className="relative z-10">
        <Hero />
        <CertificatesSection />
        <AchievementsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
