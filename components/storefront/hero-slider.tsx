"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const AUTO_MS = 6000;
const KEN_DURATION_S = 5.6;

export type HeroSlide = {
  src: string;
  alt: string;
  objectPosition?: string;
};

/**
 * Plain <img> so portrait slides get true edge-to-edge `object-fit: cover`.
 * `next/image` + `fill` kept letterboxing these assets in production despite wrapper tweaks.
 */
function HeroSlideImage({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  const objectPosition = slide.objectPosition ?? "center";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hero needs predictable cover; local /public assets only
    <img
      src={slide.src}
      alt={slide.alt}
      className="absolute inset-0 !h-full !w-full max-w-none origin-center scale-[1.1] object-cover"
      style={{ objectFit: "cover", objectPosition }}
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      decoding="async"
    />
  );
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const [motionTick, setMotionTick] = React.useState(0);
  const reduceMotion = useReducedMotion();
  const count = slides.length;
  const skipKenBurns = reduceMotion === true;

  const firstIndex = React.useRef(true);
  React.useEffect(() => {
    if (firstIndex.current) {
      firstIndex.current = false;
      return;
    }
    setMotionTick((t) => t + 1);
  }, [index]);

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
    <div className="relative h-[min(47vh,552px)] min-h-[240px] w-full md:h-[min(49vh,576px)] md:min-h-[312px]">
      {slides.map((slide, i) => {
        const useKenBurns = i === index && !skipKenBurns && i === 0;

        return (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0 size-full min-h-0 overflow-hidden transition-opacity duration-700 ease-out",
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
          )}
          aria-hidden={i !== index}
        >
          {useKenBurns ? (
            <motion.div
              key={`${i}-${motionTick}`}
              className="absolute inset-0 size-full min-h-0 overflow-hidden"
              initial={{ scale: 1.09, x: "-0.8%", y: "0.2%" }}
              animate={{ scale: 1.02, x: "0.6%", y: "-0.35%" }}
              transition={{ duration: KEN_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroSlideImage slide={slide} priority={i === 0} />
            </motion.div>
          ) : (
            <HeroSlideImage slide={slide} priority={i === 0} />
          )}
        </div>
        );
      })}

      {count > 1 && (
        <>
          <div
            className="absolute bottom-2.5 left-1/2 z-[3] flex -translate-x-1/2 gap-1.5 md:bottom-4"
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
                  "h-1 rounded-full transition-all",
                  i === index ? "w-3.5 bg-white" : "w-1 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
