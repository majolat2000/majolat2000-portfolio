import { Star } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Education() {
  return (
    <Section
      id="education"
      eyebrow="Education"
      title={
        <>
          Where I&apos;m <span className="text-gradient italic">learning</span>
        </>
      }
      description="The academic foundation I'm building — one first-class semester at a time."
    >
      <ol className="relative space-y-8 border-l border-indigo-200/70 pl-8">
        {portfolio.education.map((item, i) => (
          <li key={item.id} className="relative">
            <span className="glass-deep absolute -left-[3rem] top-2 grid h-9 w-9 place-items-center rounded-full bg-white/80 shadow-md shadow-indigo-500/20 ring-1 ring-white/70">
              <Favicon src={favicons.coursera} alt="Education" size={16} />
            </span>
            <Reveal delay={i * 0.1}>
              <div className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                      {item.school}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                      {item.degree}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-amber-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    <Star className="h-3 w-3" />
                    {item.honors}
                  </span>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Favicon src={favicons.calendar} alt="Calendar" size={14} />
                    {item.period} · Expected graduation
                  </span>
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
