"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const FALLBACK_SRC = "/brand/logo.png";

type OrbitCategoryImageSlotProps = {
  imageSrc: string;
  imageAlt: string;
  heightPx: number;
};

/**
 * Category orbit cards used a near-black frame; when `/images/category-orbit/*.png` 404s
 * (e.g. missing on disk or deploy), the hero read as “broken” black slabs. Soft surface +
 * logo fallback keeps the layout on-brand.
 */
export function OrbitCategoryImageSlot({ imageSrc, imageAlt, heightPx }: OrbitCategoryImageSlotProps) {
  const [src, setSrc] = React.useState(imageSrc);

  React.useEffect(() => {
    setSrc(imageSrc);
  }, [imageSrc]);

  return (
    <span
      className={cn(
        "relative z-[1] block w-full shrink-0 overflow-hidden",
        "bg-[hsl(38,22%,93%)] ring-1 ring-inset ring-black/[0.06]"
      )}
      style={{
        height: heightPx,
        WebkitTransform: "translateZ(0.1px)",
        transform: "translateZ(0.1px)"
      }}
      role="img"
      aria-label={imageAlt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- orbit needs onError fallback; small fixed slots */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain p-0.5 sm:p-1"
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
