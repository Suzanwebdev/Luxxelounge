"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const AUTO_MS = 6000;
const KEN_DURATION_S = 5.6;

export type HeroSlide = {
  src: string;
  alt: string;
};

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
    <div className="relative h-[62vh] min-h-[380px] w-full md:h-[70vh] md:min-h-[500px]">
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out",
            i === index ? "z-[1] opacity-100" : "z-0 opacity-0"
          )}
          aria-hidden={i !== index}
        >
          {i === index && !skipKenBurns ? (
            <motion.div
              key={`${i}-${motionTick}`}
              className="absolute inset-0"
              initial={{ scale: 1.09, x: "-0.8%", y: "0.2%" }}
              animate={{ scale: 1.02, x: "0.6%", y: "-0.35%" }}
              transition={{ duration: KEN_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                priority={i === 0}
                sizes="100vw"
              />
            </motion.div>
          ) : (
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover object-center"
              priority={i === 0}
              sizes="100vw"
            />
          )}
        </div>
      ))}

      {count > 1 && (
        <>
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
