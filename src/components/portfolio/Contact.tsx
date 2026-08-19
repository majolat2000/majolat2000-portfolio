import {
  ArrowUpRight,
  Download,
  Linkedin,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { portfolio } from "@/lib/portfolio";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const channels: {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: Mail,
    label: "Email",
    value: portfolio.email,
    href: `mailto:${portfolio.email}`,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: portfolio.linkedinHandle,
    href: portfolio.linkedinUrl,
    external: true,
  },
];

export function Contact() {
  return (
    <Section id="contact" className="pb-28 sm:pb-32">
      <Reveal>
        <div className="glass-deep relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-300/35 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow justify-center">Contact</p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              Let&apos;s build something{" "}
              <span className="text-gradient italic">together</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Whether it&apos;s an internship opportunity, a virtual-assistant
              role, or a project idea — my inbox is open. I&apos;d love to hear
              from you.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {channels.map(({ icon: Icon, label, value, href, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="glass group rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/25">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="truncate">{value}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${portfolio.email}`}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Send me an email
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Linkedin className="h-4 w-4 text-primary" />
                Connect on LinkedIn
              </a>
              <a
                href={portfolio.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Download className="h-4 w-4 text-primary" />
                View resume
              </a>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
              Prefer email? I usually reply within a day.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
