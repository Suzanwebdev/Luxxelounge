"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTO_MS = 6000;

export type HeroSlide = {
  src: string;
  alt: string;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const count = slides.length;

  const go = React.useCallback(
    (dir: number) => {
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  React.useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, go]);

  return (
    <div className="relative h-[62vh] min-h-[380px] w-full md:h-[70vh] md:min-h-[500px]">
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
          )}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-[3] -translate-y-1/2 rounded-full border border-white/25 bg-black/20 p-2 text-white backdrop-blur-sm transition hover:bg-black/35 md:left-5"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 rounded-full border border-white/25 bg-black/20 p-2 text-white backdrop-blur-sm transition hover:bg-black/35 md:right-5"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-2 md:bottom-6"
            role="tablist"
            aria-label="Hero slides"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
