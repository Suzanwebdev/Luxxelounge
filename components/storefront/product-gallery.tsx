"use client";

import * as React from "react";
import Image from "next/image";

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const gallery = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeImage = gallery[activeIndex] || gallery[0] || "";

  if (!activeImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted/30">
        <Image
          src={activeImage}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {gallery.slice(0, 8).map((imageUrl, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={`${imageUrl}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-2xl border bg-accent/40 ${
                active ? "border-primary ring-2 ring-primary/30" : "border-border"
              }`}
              aria-label={`Preview image ${i + 1}`}
              aria-pressed={active}
            >
              <Image
                src={imageUrl}
                alt={`${name} — view ${i + 1}`}
                fill
                loading="lazy"
                sizes="80px"
                className="object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
