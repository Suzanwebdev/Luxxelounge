"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const FALLBACK_SRC = "/brand/logo.png";

type OrbitCategoryImageSlotProps = {
  imageSrc: string;
  imageAlt: string;
};

/**
 * Category orbit cards used a near-black frame; when `/images/category-orbit/*.png` 404s
 * (e.g. missing on disk or deploy), the hero read as “broken” black slabs. Soft surface +
 * logo fallback keeps the layout on-brand.
 */
export function OrbitCategoryImageSlot({ imageSrc, imageAlt }: OrbitCategoryImageSlotProps) {
  const [src, setSrc] = React.useState(imageSrc);

  React.useEffect(() => {
    setSrc(imageSrc);
  }, [imageSrc]);

  return (
    <span
      className={cn(
        "absolute inset-0 z-[1] block overflow-hidden rounded-inherit",
        "bg-neutral-900"
      )}
      style={{ WebkitTransform: "translateZ(0.1px)", transform: "translateZ(0.1px)" }}
      role="img"
      aria-label={imageAlt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- orbit needs onError fallback; small fixed slots */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ WebkitTransform: "translateZ(0)", transform: "translateZ(0)" }}
        loading="eager"
        decoding="async"
        draggable={false}
        onError={() => {
          if (src !== FALLBACK_SRC) setSrc(FALLBACK_SRC);
        }}
      />
    </span>
  );
}
