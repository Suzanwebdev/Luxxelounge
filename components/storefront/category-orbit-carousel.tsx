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

function useOrbitDimensions(): OrbitDims {
  const [dims, setDims] = React.useState<OrbitDims>({ rx: 200, rz: 48, card: 104 });

  React.useEffect(() => {
    const update = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      if (w < 480) setDims({ rx: 92, rz: 26, card: 76 });
      else if (w < 640) setDims({ rx: 118, rz: 32, card: 88 });
      else if (w < 1024) setDims({ rx: 168, rz: 44, card: 100 });
      else setDims({ rx: 240, rz: 56, card: 116 });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
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

type CategoryOrbitCarouselProps = {
  items: readonly OrbitCategoryItem[];
  className?: string;
};

/**
 * Premium 3D oval orbit for category cards — GPU transforms, rAF loop, drag + hover pause + click-to-front.
 */
export function CategoryOrbitCarousel({ items, className }: CategoryOrbitCarouselProps) {
  const n = items.length;
  const dims = useOrbitDimensions();
  const reducedMotion = usePrefersReducedMotion();

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
  const DRAG_SENS = 0.0048;
  const LERP = 0.09;
  const FRONT_EPS = 0.04;

  const applyTransforms = React.useCallback(() => {
    const { rx, rz, card } = dims;
    const rot = rotationRef.current;
    let frontZ = -Infinity;
    let frontI = -1;

    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n + rot;
      const z = rz * Math.sin(angle);
      if (z > frontZ) {
        frontZ = z;
        frontI = i;
      }
    }

    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;

      const angle = (2 * Math.PI * i) / n + rot;
      const x = rx * Math.cos(angle);
      const z = rz * Math.sin(angle);
      const tClamped = rz > 0.001 ? Math.max(0, Math.min(1, (z + rz) / (2 * rz))) : 0.5;
      const scale = 0.78 + tClamped * 0.38;
      const opacity = 0.52 + tClamped * 0.48;
      const blurPx = (1 - tClamped) * 1.25;
      const isFront = i === frontI && z > rz * 0.32;

      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(Math.round(40 + z));
      el.style.filter = blurPx > 0.35 ? `blur(${blurPx.toFixed(2)}px)` : "none";
      el.dataset.front = isFront ? "true" : "false";

      const surface = cardSurfaceRefs.current[i];
      if (surface) {
        if (isFront) {
          surface.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04), 0 0 42px -8px rgba(180, 150, 110, 0.22)";
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
    rotationRef.current = dragStartRotRef.current - dx * DRAG_SENS;
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
        "relative overflow-hidden py-10 md:py-16",
        "bg-[linear-gradient(180deg,hsl(38,22%,96%)_0%,hsl(36,18%,94%)_45%,hsl(38,20%,95%)_100%)]",
        className
      )}
    >
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Browse by category
        </p>
        <h2 className="mb-10 text-center font-heading text-2xl text-foreground md:text-3xl">
          Curated for your space
        </h2>

        <div
          className="relative mx-auto flex min-h-[min(52vw,320px)] w-full max-w-5xl items-center justify-center md:min-h-[380px]"
          style={{
            perspective: "min(1400px, 95vw)",
            perspectiveOrigin: "50% 45%"
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
              className="relative mx-auto cursor-grab touch-pan-y active:cursor-grabbing"
              style={{
                transform: "rotateX(11deg)",
                transformStyle: "preserve-3d",
                height: dims.card + 48,
                width: "100%",
                maxWidth: dims.rx * 2 + dims.card + 48
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
                        "flex size-full items-center justify-center rounded-2xl border border-[hsl(38,18%,88%)] bg-white p-3 text-center",
                        "font-body text-sm font-medium leading-snug text-foreground text-balance",
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

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Drag to explore · Hover to pause · Tap a card to bring it forward
        </p>
      </div>
    </section>
  );
}
