import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Award, BadgeCheck, Fingerprint, Play, Sparkles } from "lucide-react";
import type { CertificateItem } from "@/lib/portfolio";
import { Favicon, favicons } from "@/components/ui/favicon";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 4500;

function CertificateSlide({ item }: { item: CertificateItem }) {
  const ready = item.status?.toLowerCase() === "verified";
  return (
    <article className="glass group relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[2rem] p-7 shadow-lg shadow-indigo-500/5 ring-1 ring-white/70 transition-shadow duration-300 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-10">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
      <Award className="absolute -bottom-8 -right-8 h-44 w-44 text-indigo-500/[0.07] transition-transform duration-500 group-hover:scale-110" />

      <div className="relative flex flex-1 flex-col">
        {/* Header: seal + title + issuer */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-16 w-16 rounded-2xl object-cover shadow-md ring-2 ring-white/80"
              />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-md ring-4 ring-white/60">
                <Favicon src={favicons.coursera} alt="Certificate" size={28} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                {item.title}
              </h3>
              {item.issuer && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  {item.issuer}
                </p>
              )}
            </div>
          </div>

          {item.status && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                ready ? "bg-emerald-100/80 text-emerald-700" : "bg-amber-100/80 text-amber-700",
              )}
            >
              {item.status}
            </span>
          )}
        </div>

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {item.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-foreground/80 ring-1 ring-white/80"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}

        {/* Footer: date, credential ID, verification link */}
        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-indigo-100/60 pt-5">
            {item.date && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Favicon src={favicons.calendar} alt="Date" size={14} />
                {item.date}
              </span>
            )}
            {item.credentialId && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Fingerprint className="h-3.5 w-3.5 text-primary" />
                ID: {item.credentialId}
              </span>
            )}
            {item.credentialUrl && (
              <a
                href={item.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-indigo-600"
              >
                View credential
                <span className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5">
                  ↗
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

interface CertificateSlideshowProps {
  items: CertificateItem[];
}

export function CertificateSlideshow({ items }: CertificateSlideshowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [emblaApi, paused]);

  useEffect(() => {
    if (!emblaApi || paused) return;
    const stop = () => setPaused(true);
    const root = emblaApi.rootNode();
    root.addEventListener("pointerdown", stop);
    root.addEventListener("keydown", stop);
    return () => {
      root.removeEventListener("pointerdown", stop);
      root.removeEventListener("keydown", stop);
    };
  }, [emblaApi, paused]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    setPaused(true);
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    setPaused(true);
  }, [emblaApi]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi?.scrollPrev();
        setPaused(true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi?.scrollNext();
        setPaused(true);
      }
    },
    [emblaApi],
  );

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Certificates slideshow"
    >
      <div
        ref={emblaRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="cursor-grab overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
      >
        <div className="flex items-stretch">
          {items.map((item) => (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              className="min-w-0 shrink-0 grow-0 basis-full px-2 py-1 sm:basis-[86%] sm:px-4 lg:basis-[68%]"
            >
              <CertificateSlide item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous certificate"
          className="glass grid h-11 w-11 place-items-center rounded-full text-foreground/80 shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
        >
          <span className="text-lg leading-none">‹</span>
        </button>

        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                emblaApi?.scrollTo(i);
                setPaused(true);
              }}
              aria-label={`Go to certificate ${i + 1}: ${item.title}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === selected
                  ? "w-7 bg-gradient-to-r from-indigo-500 to-sky-400 shadow-sm shadow-indigo-500/40"
                  : "w-2 bg-foreground/15 hover:bg-foreground/30",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next certificate"
          className="glass grid h-11 w-11 place-items-center rounded-full text-foreground/80 shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg"
        >
          <span className="text-lg leading-none">›</span>
        </button>
      </div>

      {/* Status row */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5">
        {paused ? (
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="glass-chip group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground/80 transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-md"
          >
            <Play className="h-3.5 w-3.5 text-primary transition-transform group-hover:scale-110" />
            Paused — you&apos;re in control
          </button>
        ) : (
          <span className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Auto-playing
          </span>
        )}

        <span className="glass-chip inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold tabular-nums text-foreground/80">
          {String(selected + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
