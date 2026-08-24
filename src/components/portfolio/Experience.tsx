import { Building2, HeartHandshake } from "lucide-react";
import { portfolio, type ExperienceItem, type VolunteeringItem } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

function PeriodBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">
      <Favicon src={favicons.calendar} alt="Calendar" size={12} />
      {children}
    </span>
  );
}

function MetaRow({ location, jobType }: { location?: string; jobType?: string }) {
  if (!location && !jobType) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
      {location && (
        <span className="inline-flex items-center gap-1.5">
          <Favicon src={favicons.maps} alt="Location" size={14} />
          {location}
        </span>
      )}
      {jobType && (
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary/70" />
          {jobType}
        </span>
      )}
    </p>
  );
}

function ExperienceCard({ item, index }: { item: ExperienceItem; index: number }) {
  return (
    <li className="relative">
      <span className="glass-deep absolute -left-[3rem] top-2 grid h-9 w-9 place-items-center rounded-full bg-white/80 shadow-md shadow-indigo-500/20 ring-1 ring-white/70">
        <Favicon src={favicons.linkedin} alt="Work" size={16} />
      </span>
      <Reveal delay={index * 0.08}>
        <div className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {item.company}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                {item.role}
              </h3>
            </div>
            <PeriodBadge>{item.period}</PeriodBadge>
          </div>

          <MetaRow location={item.location} jobType={item.jobType} />

          {item.skills && item.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-indigo-200/60 bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </li>
  );
}

function VolunteeringCard({ item, index }: { item: VolunteeringItem; index: number }) {
  return (
    <li className="relative">
      <span className="glass-deep absolute -left-[3rem] top-2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-primary shadow-md shadow-indigo-500/20 ring-1 ring-white/70">
        <HeartHandshake className="h-4 w-4" />
      </span>
      <Reveal delay={index * 0.08}>
        <div className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {item.organization}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">
                {item.role}
              </h3>
            </div>
            <PeriodBadge>{item.period}</PeriodBadge>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200/70 bg-violet-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
            <HeartHandshake className="h-3 w-3" />
            {item.cause}
          </span>
        </div>
      </Reveal>
    </li>
  );
}

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
      description="Professional and community milestones — from internships across tech and fintech to the causes I give my time to."
    >
      <div className="space-y-14">
        {/* Professional experience */}
        <div>
          <Reveal>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 shadow-md shadow-sky-500/20 ring-1 ring-white/70">
                  <Favicon src={favicons.linkedin} alt="Professional" size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Professional Experience
                  </h3>
                  <p className="text-xs text-muted-foreground">Internships and roles building real-world skills</p>
                </div>
              </div>
              <span className="glass-chip rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground/70">
                {portfolio.experience.length} roles
              </span>
            </div>
          </Reveal>
          <ol className="relative space-y-8 border-l border-indigo-200/70 pl-8">
            {portfolio.experience.map((item, i) => (
              <ExperienceCard key={item.id} item={item} index={i} />
            ))}
          </ol>
        </div>

        {/* Volunteering */}
        <div>
          <Reveal>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-md shadow-violet-500/30">
                  <HeartHandshake className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Volunteering & Community
                  </h3>
                  <p className="text-xs text-muted-foreground">Causes I give my time and skills to</p>
                </div>
              </div>
              <span className="glass-chip rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground/70">
                {portfolio.volunteering.length} causes
              </span>
            </div>
          </Reveal>
          <ol className="relative space-y-8 border-l border-indigo-200/70 pl-8">
            {portfolio.volunteering.map((item, i) => (
              <VolunteeringCard key={item.id} item={item} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
