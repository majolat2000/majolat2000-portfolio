import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children: ReactNode;
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn("relative py-20 sm:py-24", className)}>
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        {(eyebrow || title || description) && (
          <Reveal
            className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}
          >
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            )}
          </Reveal>
        )}
        <div className={eyebrow || title || description ? "mt-12 sm:mt-14" : ""}>
          {children}
        </div>
      </div>
    </section>
  );
}
