"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EASE_CSS = "cubic-bezier(0.4, 0, 0.2, 1)";

export type OrbitCategoryItem = {
  label: string;
  href: string;
};

type OrbitDims = {
  rx: number;
  rz: number;
  card: number;
};

/** Fit ellipse + card size to the actual carousel container (mobile + desktop). */
function dimsForContainerWidth(w: number): OrbitDims {
  const width = Math.max(w, 260);
  let card: number;
  let rx: number;
  if (width < 360) {
    card = Math.round(Math.min(80, Math.max(68, width * 0.21)));
    rx = Math.min((width - 8) * 0.4, 108);
  } else if (width < 480) {
    card = 76;
    rx = Math.min(width * 0.38, 120);
  } else if (width < 640) {
    card = 86;
    rx = Math.min(width * 0.38, 138);
  } else if (width < 1024) {
    card = 100;
    rx = Math.min(width * 0.36, 190);
  } else {
    card = 116;
    rx = Math.min(width * 0.34, 248);
  }
  const rz = rx * (width < 640 ? 0.3 : 0.24);
  return {
    rx: Math.max(rx, 64),
    rz: Math.max(rz, 18),
    card
  };
}

function useOrbitContainerDims(containerRef: React.RefObject<HTMLElement | null>) {
  const [dims, setDims] = React.useState<OrbitDims>(() =>
    typeof window !== "undefined" ? dimsForContainerWidth(window.innerWidth - 32) : { rx: 100, rz: 28, card: 80 }
  );

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setDims(dimsForContainerWidth(w));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return dims;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function shortestRotationDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function rotationForIndexAtFront(i: number, n: number): number {
  return Math.PI / 2 - (2 * Math.PI * i) / n;
}

function smoothstep01(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

type CategoryOrbitCarouselProps = {
  items: readonly OrbitCategoryItem[];
  className?: string;
};

/**
 * Premium 3D oval orbit for category cards — GPU transforms, rAF loop, drag + hover pause + click-to-front.
 * The horizontally centered card (tie-break: nearer in Z) is always the hero: largest scale, full opacity, no blur, top z-index.
 */
export function CategoryOrbitCarousel({ items, className }: CategoryOrbitCarouselProps) {
  const n = items.length;
  const orbitContainerRef = React.useRef<HTMLDivElement | null>(null);
  const dims = useOrbitContainerDims(orbitContainerRef);
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointerRef = React.useRef(
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );

  React.useLayoutEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    coarsePointerRef.current = mq.matches;
    const fn = () => {
      coarsePointerRef.current = mq.matches;
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const rotationRef = React.useRef(0);
  const snapTargetRef = React.useRef<number | null>(null);
  const pausedRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartRotRef = React.useRef(0);
  const movedRef = React.useRef(false);
  const rafRef = React.useRef(0);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const cardSurfaceRefs = React.useRef<(HTMLElement | null)[]>([]);

  const AUTO_SPEED = 0.042;
  const LERP = 0.09;
  const FRONT_EPS = 0.04;

  const applyTransforms = React.useCallback(() => {
    const { rx, rz } = dims;
    const rot = rotationRef.current;
    const neighbor = (2 * Math.PI) / n;

    let focusI = 0;
    let minAbsX = Infinity;
    let bestZAtMinX = -Infinity;

    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n + rot;
      const x = rx * Math.cos(angle);
      const z = rz * Math.sin(angle);
      const ax = Math.abs(x);
      if (ax < minAbsX - 1e-9) {
        minAbsX = ax;
        bestZAtMinX = z;
        focusI = i;
      } else if (Math.abs(ax - minAbsX) <= 1e-9 && z > bestZAtMinX) {
        bestZAtMinX = z;
        focusI = i;
      }
    }

    const angleFocus = (2 * Math.PI * focusI) / n + rot;

    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;

      const angle = (2 * Math.PI * i) / n + rot;
      const x = rx * Math.cos(angle);
      const z = rz * Math.sin(angle);

      let da = Math.abs(angle - angleFocus);
      if (da > Math.PI) da = 2 * Math.PI - da;
      const tDist = smoothstep01(Math.min(1, da / (neighbor * 0.52)));

      const isCenter = i === focusI;
      let scale = 1.22 * (1 - tDist) + 0.78 * tDist;
      let opacity = 1 * (1 - tDist) + 0.56 * tDist;
      let blurPx = tDist * 2.2;

      if (isCenter) {
        scale = 1.22;
        opacity = 1;
        blurPx = 0;
      } else {
        scale = Math.min(0.9, Math.max(0.75, scale));
        opacity = Math.min(0.8, Math.max(0.5, opacity));
      }

      const zLayer = isCenter ? 320 : Math.round(60 + z * 0.35);

      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(zLayer);
      el.style.filter = blurPx > 0.4 ? `blur(${blurPx.toFixed(2)}px)` : "none";
      el.dataset.front = isCenter ? "true" : "false";

      const surface = cardSurfaceRefs.current[i];
      if (surface) {
        if (isCenter) {
          surface.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04), 0 0 48px -6px rgba(180, 150, 110, 0.28)";
        } else {
          surface.style.boxShadow = "0 10px 30px rgba(0,0,0,0.06)";
        }
      }
    }
  }, [dims, n]);

  React.useLayoutEffect(() => {
    if (reducedMotion) {
      rotationRef.current = rotationForIndexAtFront(0, n);
    }
    applyTransforms();
  }, [applyTransforms, reducedMotion, n]);

  React.useEffect(() => {
    if (reducedMotion) return;

    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const snap = snapTargetRef.current;
      if (snap !== null) {
        let diff = snap - rotationRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < FRONT_EPS) {
          rotationRef.current = snap;
          snapTargetRef.current = null;
        } else {
          rotationRef.current += diff * LERP;
        }
      } else if (!pausedRef.current && !draggingRef.current) {
        rotationRef.current += AUTO_SPEED * dt;
      }

      applyTransforms();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [applyTransforms, reducedMotion]);

  React.useEffect(() => {
    applyTransforms();
  }, [applyTransforms, dims]);

  const sectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || reducedMotion) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const p = 1 - (rect.top + rect.height / 2) / (vh + rect.height);
        const offset = Math.max(-1, Math.min(1, p)) * 12;
        const stage = el.querySelector<HTMLElement>("[data-orbit-stage]");
        if (stage) {
          stage.style.transform = `translateY(${offset.toFixed(2)}px)`;
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const bringIndexToFront = React.useCallback(
    (i: number) => {
      const ideal = rotationForIndexAtFront(i, n);
      const delta = shortestRotationDelta(rotationRef.current, ideal);
      snapTargetRef.current = rotationRef.current + delta;
    },
    [n]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (reducedMotion) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    movedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartRotRef.current = rotationRef.current;
    snapTargetRef.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || reducedMotion) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    const sens = coarsePointerRef.current ? 0.0072 : 0.0048;
    rotationRef.current = dragStartRotRef.current - dx * sens;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    draggingRef.current = false;
  };

  const onCardClick = (e: React.MouseEvent, i: number) => {
    if (movedRef.current) {
      e.preventDefault();
      return;
    }
    const el = itemRefs.current[i];
    const isFront = el?.dataset.front === "true";
    if (!isFront) {
      e.preventDefault();
      bringIndexToFront(i);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-x-clip overflow-y-visible py-8 sm:py-10 md:py-16",
        "bg-[linear-gradient(180deg,hsl(38,22%,96%)_0%,hsl(36,18%,94%)_45%,hsl(38,20%,95%)_100%)]",
        "pb-[max(2rem,env(safe-area-inset-bottom,0px))]",
        className
      )}
    >
      <div
        className="mx-auto max-w-7xl pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6 lg:px-8"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        <p className="mb-1.5 text-center text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
          Browse by category
        </p>
        <h2 className="mb-6 text-center font-heading text-xl text-foreground sm:mb-8 sm:text-2xl md:mb-10 md:text-3xl">
          Curated for your space
        </h2>

        <div
          ref={orbitContainerRef}
          className="relative mx-auto flex min-h-[260px] w-full max-w-5xl items-center justify-center sm:min-h-[min(52vw,320px)] md:min-h-[380px]"
          style={{
            perspective: "min(1200px, 100vw)",
            perspectiveOrigin: "50% 42%"
          }}
        >
          <div
            data-orbit-stage
            className={cn(
              "relative h-full w-full",
              reducedMotion && "transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              role="region"
              aria-label="Category carousel"
              className="relative mx-auto w-full max-w-full cursor-grab touch-none select-none active:cursor-grabbing"
              style={{
                transform: `rotateX(${dims.card < 82 ? 8 : 11}deg)`,
                transformStyle: "preserve-3d",
                height: dims.card + (dims.card < 82 ? 40 : 48),
                width: "100%",
                maxWidth: "100%"
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: 0,
                  height: 0,
                  transformStyle: "preserve-3d"
                }}
              >
                {items.map((item, i) => (
                  <div
                    key={item.label}
                    ref={(node) => {
                      itemRefs.current[i] = node;
                    }}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: 0,
                      top: 0,
                      width: dims.card,
                      height: dims.card,
                      marginLeft: -dims.card / 2,
                      marginTop: -dims.card / 2,
                      transformStyle: "preserve-3d",
                      willChange: "transform, opacity",
                      transition: reducedMotion ? `transform 0.7s ${EASE_CSS}, opacity 0.7s ${EASE_CSS}, filter 0.7s ${EASE_CSS}` : "none"
                    }}
                  >
                    <Link
                      ref={(node) => {
                        cardSurfaceRefs.current[i] = node;
                      }}
                      href={item.href}
                      data-orbit-card
                      onClick={(e) => onCardClick(e, i)}
                      className={cn(
                        "flex min-h-[44px] min-w-[44px] size-full items-center justify-center rounded-2xl border border-[hsl(38,18%,88%)] bg-white p-2 text-center sm:p-3",
                        "font-body text-[0.7rem] font-medium leading-snug text-foreground text-balance sm:text-sm",
                        "transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        "select-none hover:border-[hsl(38,12%,72%)] active:scale-[0.98]",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                      )}
                      style={{
                        transform: "translateZ(0.1px)",
                        backfaceVisibility: "hidden"
                      }}
                      draggable={false}
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 px-1 text-center text-[0.65rem] leading-relaxed text-muted-foreground sm:mt-8 sm:text-xs">
          <span className="md:hidden">Swipe the carousel · Tap a card to focus · Tap again to open</span>
          <span className="hidden md:inline">
            Drag to explore · Hover to pause · Tap a card to bring it forward
          </span>
        </p>
      </div>
    </section>
  );
}
