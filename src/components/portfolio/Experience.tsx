import { Briefcase, Clock, HeartHandshake } from "lucide-react";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const timeline = [
  {
    icon: Briefcase,
    role: "Professional Experience",
    title: "Internship experience",
    tag: "Details coming soon",
    description:
      "I'm currently building hands-on professional experience through internships — sharpening my skills in real-world settings. Roles, achievements and highlights will be added here soon.",
  },
  {
    icon: HeartHandshake,
    role: "Community",
    title: "Volunteering & community work",
    tag: "Adding soon",
    description:
      "Giving back through volunteering is a big part of who I am. The causes I support and the contributions I make will be showcased here soon.",
  },
];

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title={
        <>
          The journey so <span className="text-gradient italic">far</span>
        </>
      }
      description="Professional and community milestones — with more chapters being written every day."
    >
      <ol className="relative space-y-8 border-l border-indigo-200/70 pl-8">
        {timeline.map((item, i) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="relative">
              <span className="glass-deep absolute -left-[3rem] top-2 grid h-9 w-9 place-items-center rounded-full text-primary shadow-md shadow-indigo-500/20">
                <Icon className="h-4 w-4" />
              </span>
              <Reveal delay={i * 0.1}>
                <div className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                      {item.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                      <Clock className="h-3 w-3" />
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
