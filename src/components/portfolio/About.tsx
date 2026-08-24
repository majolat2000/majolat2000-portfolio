import { Target } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const traitFavicons: Array<{ src?: string; alt: string; Icon?: typeof Target }> = [
  { Icon: Target, alt: "Target" },
  { src: favicons.figma, alt: "Palette" },
  { src: favicons.github, alt: "Brain" },
  { src: favicons.google, alt: "Download" },
];

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About me"
      title={
        <>
          Curious, structured, and{" "}
          <span className="text-gradient italic">a little creative</span>
        </>
      }
      description="The story behind the pixels — who I am, how I think, and what drives me."
    >
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* Story */}
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-10">
            <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky-200/50 blur-2xl" />
            <div className="relative">
              <p className="text-lg leading-relaxed text-foreground/85 sm:text-xl">
                {portfolio.about}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {portfolio.traits.map((trait, i) => {
                  const fav = traitFavicons[i % traitFavicons.length];
                  return (
                    <div
                      key={trait.label}
                      className="glass-chip flex items-start gap-3 rounded-2xl p-4"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm">
                        {fav.Icon ? (
                          <fav.Icon className="h-4 w-4 text-primary" />
                        ) : (
                          <Favicon src={fav.src!} alt={fav.alt} size={16} />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{trait.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {trait.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Quick facts */}
        <Reveal delay={0.12}>
          <div className="glass-deep rounded-3xl p-8 sm:p-10">
            <h3 className="font-display text-xl font-semibold text-foreground">Quick facts</h3>
            <ul className="mt-6 space-y-5">
              <li className="flex items-start justify-between gap-4 border-b border-indigo-100/70 pb-4">
                <span className="text-sm font-medium text-muted-foreground">Name</span>
                <span className="text-right text-sm font-semibold text-foreground">
                  {portfolio.name}
                </span>
              </li>
              <li className="flex items-start justify-between gap-4 border-b border-indigo-100/70 pb-4">
                <span className="text-sm font-medium text-muted-foreground">Focus</span>
                <span className="text-right text-sm font-semibold text-foreground">
                  {portfolio.roles.join(" · ")}
                </span>
              </li>
              <li className="flex items-start justify-between gap-4 border-b border-indigo-100/70 pb-4">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <a
                  href={`mailto:${portfolio.email}`}
                  className="break-all text-right text-sm font-semibold text-primary transition-colors hover:text-primary/75"
                >
                  {portfolio.email}
                </a>
              </li>
              <li className="flex items-start justify-between gap-4 border-b border-indigo-100/70 pb-4">
                <span className="text-sm font-medium text-muted-foreground">LinkedIn</span>
                <a
                  href={portfolio.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-right text-sm font-semibold text-primary transition-colors hover:text-primary/75"
                >
                  {portfolio.linkedinHandle}
                </a>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Resume</span>
                <a
                  href={portfolio.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-right text-sm font-semibold text-primary transition-colors hover:text-primary/75"
                >
                  View resume
                  <span>↗</span>
                </a>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <a
                href={`mailto:${portfolio.email}`}
                className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
              >
                <Favicon src={favicons.gmail} alt="Email" size={14} />
                Email me
              </a>
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
              >
                <Favicon src={favicons.linkedin} alt="LinkedIn" size={14} />
                LinkedIn
              </a>
              <a
                href={portfolio.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
              >
                <span>↗</span>
                Resume
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
