import {
  Award,
  Briefcase,
  HeartHandshake,
  Search,
  SearchX,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { portfolio, type CatalogItem } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "certificate", label: "Certificates" },
  { id: "experience", label: "Experience" },
  { id: "volunteering", label: "Volunteering" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const TYPE_META: Record<
  CatalogItem["type"],
  { icon: LucideIcon; tile: string; badge: string; label: string }
> = {
  certificate: {
    icon: Award,
    tile: "from-indigo-500 to-violet-400",
    badge: "bg-indigo-100/80 text-indigo-700",
    label: "Certificate",
  },
  experience: {
    icon: Briefcase,
    tile: "from-sky-500 to-cyan-400",
    badge: "bg-sky-100/80 text-sky-700",
    label: "Experience",
  },
  volunteering: {
    icon: HeartHandshake,
    tile: "from-violet-500 to-fuchsia-400",
    badge: "bg-violet-100/80 text-violet-700",
    label: "Volunteering",
  },
};

export function Catalog() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return portfolio.catalog.filter((item) => {
      const matchesFilter = filter === "all" || item.type === filter;
      const matchesQuery =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const hasQuery = query.trim().length > 0;

  return (
    <Section
      id="catalog"
      eyebrow="The catalog"
      title={
        <>
          Browse the <span className="text-gradient italic">collection</span>
        </>
      }
      description={portfolio.catalogNote}
      align="center"
    >
      {/* Search + filters */}
      <Reveal>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <div className="glass-deep flex w-full items-center gap-3 rounded-full px-5 py-2.5 shadow-lg shadow-indigo-500/5 transition-shadow focus-within:shadow-indigo-500/15">
            <Search className="h-4 w-4 shrink-0 text-primary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search certificates, roles, causes…"
              aria-label="Search the catalog"
              className="w-full bg-transparent py-1.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="rounded-full bg-white/70 p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <SearchX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-all",
                  filter === f.id
                    ? "bg-gradient-to-r from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/30"
                    : "glass-chip text-foreground/70 hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            return (
              <Reveal key={item.id} delay={Math.min(i, 5) * 0.06}>
                <div className="glass group relative h-full overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110",
                          meta.tile,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                          meta.badge,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                      <Sparkles className="h-3 w-3" />
                      {item.status}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <Reveal>
          <div className="glass-deep mx-auto mt-12 max-w-lg rounded-3xl px-8 py-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md">
              <SearchX className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
              Nothing matches that yet
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Try a different search, or clear the filters to see the whole
              collection.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
            >
              Clear search
            </button>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <p className="mt-10 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "item" : "items"} in the
          catalog
        </p>
      </Reveal>
    </Section>
  );
}
