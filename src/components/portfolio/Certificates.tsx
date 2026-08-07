import { Award, BadgeCheck, Clock } from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const placeholders = [
  {
    title: "Certificate 01",
    hint: "Courses and certifications I've earned",
  },
  {
    title: "Certificate 02",
    hint: "Professional and academic achievements",
  },
  {
    title: "Certificate 03",
    hint: "More credentials on the way",
  },
];

export function Certificates() {
  return (
    <Section
      id="certificates"
      eyebrow="Certificates"
      title={
        <>
          Certified &amp; <span className="text-gradient italic">counting</span>
        </>
      }
      description={portfolio.certificates.note}
      align="center"
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {placeholders.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-dashed border-indigo-300/60 bg-white/45 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white/65 hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-indigo-400 shadow-sm ring-1 ring-white/90 transition-colors group-hover:text-primary">
                  <Award className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground/85">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.hint}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  <Clock className="h-3 w-3" />
                  Adding soon
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2}>
        <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeCheck className="h-4 w-4 text-primary" />
          More credentials will land here as I earn them.
        </p>
      </Reveal>
    </Section>
  );
}
