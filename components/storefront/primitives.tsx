import type { ReactNode } from "react";
import { cn, formatGhs } from "@/lib/utils";
import type { ProductTag } from "@/lib/storefront/mock-data";

export function Container({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={cn("py-10 md:py-16", className)}>{children}</section>;
}

export function Heading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 space-y-2">
      {eyebrow ? <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p> : null}
      <h2 className="font-heading text-3xl md:text-4xl leading-tight">{title}</h2>
      {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function Price({ price, compareAt }: { price: number; compareAt?: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="font-medium">{formatGhs(price)}</p>
      {compareAt ? <p className="text-sm text-muted-foreground line-through">{formatGhs(compareAt)}</p> : null}
    </div>
  );
}

export function BadgeSet({ tags }: { tags: ProductTag[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-accent px-2.5 py-1 text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
