import { Mail, Send } from "lucide-react";
import { useForm, ValidationError } from "@formspree/react";
import { portfolio } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const channels: Array<
  | { Icon: typeof Mail; label: string; value: string; href: string; external?: boolean }
  | { src: string; alt: string; label: string; value: string; href: string; external?: boolean }
> = [
  {
    Icon: Mail,
    label: "Email",
    value: portfolio.email,
    href: `mailto:${portfolio.email}`,
  },
  {
    src: favicons.linkedin,
    alt: "LinkedIn",
    label: "LinkedIn",
    value: portfolio.linkedinHandle,
    href: portfolio.linkedinUrl,
    external: true,
  },
];

function ContactForm() {
  const [state, handleSubmit] = useForm("xeajwywl");

  if (state.succeeded) {
    return (
      <div className="glass mt-10 rounded-[1.75rem] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
          <Favicon src={favicons.gmail} alt="Sent" size={24} />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Thanks for reaching out!
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Your message has been sent successfully. I&apos;ll get back to you
          within a day at the email you provided.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Prefer a faster channel?{" "}
          <a
            href={`mailto:${portfolio.email}`}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Email me directly
          </a>{" "}
          or{" "}
          <a
            href={portfolio.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            DM on LinkedIn
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass mt-10 rounded-[1.75rem] p-6 text-left sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/25">
          <Send className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Send me a message
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Fill the form and I&apos;ll reply as soon as possible.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Majesty Olatimilehin"
            required
            autoComplete="name"
            className="bg-white/60"
          />
          <ValidationError
            prefix="Name"
            field="name"
            errors={state.errors}
            className="text-sm text-destructive"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="bg-white/60"
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
            className="text-sm text-destructive"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell me about the opportunity, project, or idea you have in mind..."
            required
            rows={5}
            className="min-h-[128px] bg-white/60"
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
            className="text-sm text-destructive"
          />
        </div>

        <ValidationError errors={state.errors} className="text-sm text-destructive" />

        <button
          type="submit"
          disabled={state.submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {state.submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending...
            </>
          ) : (
            <>
              Send message
              <Favicon src={favicons.gmail} alt="" size={14} className="rounded-[3px] ring-white/20" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://formspree.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            Formspree
          </a>{" "}
          — your email stays private.
        </p>
      </div>
    </form>
  );
}

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
              {channels.map((ch) => {
                const { label, value, href, external } = ch;
                return (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="glass group rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/25">
                      {"Icon" in ch ? (
                        <ch.Icon className="h-4 w-4" />
                      ) : (
                        <Favicon src={ch.src} alt={ch.alt} size={18} className="rounded-[4px] ring-white/20" />
                      )}
                    </span>
                  <span className="mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="truncate">{value}</span>
                    <span className="shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      ↗
                    </span>
                  </span>
                </a>
                  );
                })}
            </div>

            <ContactForm />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${portfolio.email}`}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Send me an email
                <span className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </a>
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Favicon src={favicons.linkedin} alt="LinkedIn" size={16} />
                Connect on LinkedIn
              </a>
              <a
                href={portfolio.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Favicon src={favicons.google} alt="Resume" size={16} />
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
