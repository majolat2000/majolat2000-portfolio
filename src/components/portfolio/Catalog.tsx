import { Section } from "@/components/portfolio/Section";
import { Link } from "react-router";
import { ArrowRight, ShoppingBag, Code, Award } from "lucide-react";
import { Reveal } from "@/components/portfolio/Reveal";

export function Catalog() {
  return (
    <Section
      id="catalog"
      eyebrow="My Work"
      title={
        <>
          Explore my <span className="text-primary">portfolio</span>
        </>
      }
      description="Select an area to view my offerings and achievements."
      align="center"
    >
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
        <Reveal delay={0.1}>
          <Link
            to="/storefront"
            className="group flex h-full flex-col items-center justify-center gap-4 rounded-3xl bg-card border border-border p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="rounded-2xl bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">Explore My Digital Products</h3>
            <span className="mt-2 text-sm text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
              Visit Storefront <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={0.2}>
          <Link
            to="/solutions"
            className="group flex h-full flex-col items-center justify-center gap-4 rounded-3xl bg-card border border-border p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="rounded-2xl bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Code className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">Browse My Digital Solutions</h3>
            <span className="mt-2 text-sm text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
              View Solutions <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={0.3}>
          <Link
            to="/credentials"
            className="group flex h-full flex-col items-center justify-center gap-4 rounded-3xl bg-card border border-border p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="rounded-2xl bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">View All Certificates &amp; Achievements</h3>
            <span className="mt-2 text-sm text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
              View Credentials <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
