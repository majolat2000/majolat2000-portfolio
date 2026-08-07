import { CalendarCheck, Code2, Sparkles, type LucideIcon } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const groupIcons: Record<string, LucideIcon> = {
  computerScience: Code2,
  virtualAssistance: CalendarCheck,
  workingStyle: Sparkles,
};

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title={
        <>
          What I bring <span className="text-gradient italic">to the table</span>
        </>
      }
      description="A toolkit shaped by computer science, sharpened by a creative mindset — and still growing every day."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {Object.values(portfolio.skills).map((group, i) => {
          const Icon = groupIcons[Object.keys(portfolio.skills)[i]];
          return (
            <Reveal key={group.title} delay={i * 0.1}>
              <div className="glass group h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                  {group.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {group.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-foreground/75 shadow-sm transition-colors hover:border-indigo-200 hover:text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={0.2}>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          …and plenty more skills &amp; tools coming soon as my journey grows.
        </p>
      </Reveal>
    </Section>
  );
}
