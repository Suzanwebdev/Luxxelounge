"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EASE_CSS = "cubic-bezier(0.4, 0, 0.2, 1)";
/** Uniform scale vs previous card sizes (~+40%). */
const CARD_SIZE_SCALE = 1.4;
/** Extra Z scale on the ellipse so front/back separation reads clearly under perspective. */
const Z_DEPTH_STRETCH = 1.32;
/** Nudge the focused card slightly toward the camera (px) for a “closer” hero read. */
const HERO_Z_POP = Math.round(22 * CARD_SIZE_SCALE);

const AUTO_ORBIT_SPEED = 0.0115;
/** Exponential ease toward snap target; frame-rate independent. */
const SNAP_DAMPING = 5.8;
const SNAP_FRONT_EPS = 0.022;

export type OrbitCategoryItem = {
  label: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

type OrbitDims = {
  rx: number;
  rz: number;
  card: number;
};

/** Fit ellipse + card size to the actual carousel container (mobile + desktop).
 *  Larger rx/rz vs card size = more arc between items so nine cards stay visually separated. */
function dimsForContainerWidth(w: number): OrbitDims {
  const width = Math.max(w, 260);
  let card: number;
  let rx: number;
  if (width < 360) {
    card = Math.round(Math.min(78, Math.max(66, width * 0.2)));
    rx = Math.min((width - 8) * 0.48, 128);
  } else if (width < 480) {
    card = 74;
    rx = Math.min(width * 0.45, 142);
  } else if (width < 640) {
    card = 84;
    rx = Math.min(width * 0.44, 162);
  } else if (width < 1024) {
    card = 96;
    rx = Math.min(width * 0.42, 220);
  } else {
    card = 108;
    rx = Math.min(width * 0.4, 288);
  }
  const rz = rx * (width < 640 ? 0.5 : 0.44);
  return {
    rx: Math.max(rx, 72) * CARD_SIZE_SCALE,
    rz: Math.max(rz, 36) * CARD_SIZE_SCALE,
    card: Math.round(card * CARD_SIZE_SCALE)
  };
}

function useOrbitContainerDims(containerRef: React.RefObject<HTMLElement | null>) {
  /** Must match SSR — do not read `window` here or hydration fails vs Node render. */
  const [dims, setDims] = React.useState<OrbitDims>(() => ({ rx: 140, rz: 50, card: 112 }));

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
    // containerRef is stable; we only need mount + one observer per container element
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref object identity is fixed
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

/** Steps around the ring (either direction); 0 = focus. */
function ringIndexDistance(i: number, focus: number, n: number): number {
  const a = Math.abs(i - focus);
  return Math.min(a, n - a);
}

/** Taller focus card; neighbors share height by equal `d`, then step down. Width unchanged (`scaleX = 1`). */
const SCALE_Y_BY_RING_DISTANCE = [1.3, 1.07, 0.96, 0.88, 0.82, 0.77] as const;

function scaleYForRingDistance(d: number): number {
  const k = Math.min(d, SCALE_Y_BY_RING_DISTANCE.length - 1);
  return SCALE_Y_BY_RING_DISTANCE[k];
}

/**
 * Hero must stay on the **near** side of the oval (local z > 0). Picking global min |x| alone
 * often chooses a **back** card with slightly smaller |x| than the true front — it keeps focus
 * and blur locked on the wrong card as the orbit turns.
 */
function focusIndexOnFrontArc(rx: number, rzEff: number, rot: number, n: number): number {
  let focusI = 0;
  let minAbsX = Infinity;
  let bestZ = -Infinity;
  let anyFront = false;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n + rot;
    const x = rx * Math.cos(angle);
    const z = rzEff * Math.sin(angle);
    if (z <= 0) continue;
    anyFront = true;
    const ax = Math.abs(x);
    if (ax < minAbsX - 1e-9) {
      minAbsX = ax;
      bestZ = z;
      focusI = i;
    } else if (Math.abs(ax - minAbsX) <= 1e-9 && z > bestZ) {
      bestZ = z;
      focusI = i;
    }
  }

  if (anyFront) return focusI;

  minAbsX = Infinity;
  bestZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n + rot;
    const x = rx * Math.cos(angle);
    const z = rzEff * Math.sin(angle);
    const ax = Math.abs(x);
    if (ax < minAbsX - 1e-9) {
      minAbsX = ax;
      bestZ = z;
      focusI = i;
    } else if (Math.abs(ax - minAbsX) <= 1e-9 && z > bestZ) {
      bestZ = z;
      focusI = i;
    }
  }
  return focusI;
}

type CategoryOrbitCarouselProps = {
  items: readonly OrbitCategoryItem[];
  className?: string;
};

/**
 * Premium 3D oval orbit for category cards — GPU transforms, rAF loop, auto-orbit while tab visible, drag + click-to-front.
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
  const pausedRef = React.useRef(
    typeof document !== "undefined" && document.visibilityState === "hidden"
  );
  const draggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartRotRef = React.useRef(0);
  const movedRef = React.useRef(false);
  const rafRef = React.useRef(0);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const cardSurfaceRefs = React.useRef<(HTMLElement | null)[]>([]);

  const applyTransforms = React.useCallback(() => {
    if (n === 0) return;
    const { rx, rz } = dims;
    const rot = rotationRef.current;
    const neighbor = (2 * Math.PI) / n;

    const rzEff = rz * Z_DEPTH_STRETCH;
    const focusI = focusIndexOnFrontArc(rx, rzEff, rot, n);

    const angleFocus = (2 * Math.PI * focusI) / n + rot;

    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;

      const angle = (2 * Math.PI * i) / n + rot;
      const x = rx * Math.cos(angle);
      const z = rzEff * Math.sin(angle);
      const isCenter = i === focusI;
      const zRender = z + (isCenter ? HERO_Z_POP : 0);

      let da = Math.abs(angle - angleFocus);
      if (da > Math.PI) da = 2 * Math.PI - da;
      const tDist = smoothstep01(Math.min(1, da / (neighbor * 0.38)));
      let opacity = 1 * (1 - tDist) + 0.5 * tDist;

      if (isCenter) {
        opacity = 1;
      } else {
        opacity = Math.min(0.72, Math.max(0.38, opacity));
      }

      const ringD = ringIndexDistance(i, focusI, n);
      const scaleY = scaleYForRingDistance(ringD);

      const zSpan = rzEff * 2;
      const zLayer = isCenter ? 450 : Math.round(12 + ((z + rzEff) / zSpan) * 235);

      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${zRender.toFixed(2)}px) scale(1, ${scaleY.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(zLayer);
      /* No `filter` on this wrapper: Safari drops `<img>` paint inside 3D + filtered ancestors. */
      el.style.filter = "none";
      el.dataset.front = isCenter ? "true" : "false";

      const surface = cardSurfaceRefs.current[i];
      if (surface) {
        if (isCenter) {
          surface.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.08), 0 18px 36px -14px rgba(0,0,0,0.14), 0 32px 64px -28px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05), 0 0 56px -8px rgba(180, 150, 110, 0.32)";
        } else {
          surface.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
        }
      }
    }
  }, [dims, n]);

  React.useLayoutEffect(() => {
    if (n === 0) return;
    if (reducedMotion) {
      rotationRef.current = rotationForIndexAtFront(0, n);
    }
    applyTransforms();
  }, [applyTransforms, reducedMotion, n]);

  React.useEffect(() => {
    if (reducedMotion || n === 0) return;

    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const snap = snapTargetRef.current;
      if (snap !== null) {
        let diff = snap - rotationRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < SNAP_FRONT_EPS) {
          rotationRef.current = snap;
          snapTargetRef.current = null;
        } else {
          const alpha = 1 - Math.exp(-SNAP_DAMPING * dt);
          rotationRef.current += diff * alpha;
        }
      } else if (!pausedRef.current && !draggingRef.current) {
        rotationRef.current += AUTO_ORBIT_SPEED * dt;
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

  React.useEffect(() => {
    const sync = () => {
      pausedRef.current = document.visibilityState === "hidden";
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

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
        const offset = Math.max(-1, Math.min(1, p)) * 7;
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

  if (n === 0) {
    return null;
  }

  /** Fixed px height so `next/image` `fill` always has a box (iOS Safari collapses `flex-1` + `min-h-0` here). */
  const orbitImageSlotPx = Math.max(56, Math.round(dims.card * 0.62));

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-x-clip overflow-y-visible py-14 sm:py-16 md:py-24 lg:py-28",
        "bg-[linear-gradient(180deg,hsl(38,22%,96%)_0%,hsl(36,18%,94%)_45%,hsl(38,20%,95%)_100%)]",
        "pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]",
        className
      )}
    >
      <div className="mx-auto max-w-7xl pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6 lg:px-8">
        <p className="mb-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:mb-2.5 sm:text-xs sm:tracking-[0.2em]">
          Browse by category
        </p>
        <h2 className="mb-6 text-center font-heading text-xl text-foreground sm:mb-8 sm:text-2xl md:mb-14 md:text-3xl">
          Curated for your space
        </h2>

        <div
          ref={orbitContainerRef}
          className="relative mx-auto flex min-h-[min(78vw,320px)] w-full max-w-5xl items-center justify-center px-2 py-5 sm:min-h-[min(68vw,420px)] sm:px-4 sm:py-8 md:min-h-[620px] md:py-12"
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 46%"
          }}
        >
          <div
            data-orbit-stage
            className={cn(
              "relative mx-auto flex h-full w-full max-w-full items-center justify-center",
              reducedMotion && "transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              role="region"
              aria-label="Category carousel"
              className="relative mx-auto w-full max-w-full cursor-grab touch-none select-none active:cursor-grabbing"
              style={{
                transform: `rotateX(${dims.card < 112 ? 9 : 13}deg)`,
                transformStyle: "preserve-3d",
                height:
                  Math.ceil(dims.card * SCALE_Y_BY_RING_DISTANCE[0]) + (dims.card < 112 ? 96 : 108),
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
                      transition: reducedMotion ? `transform 0.7s ${EASE_CSS}, opacity 0.7s ${EASE_CSS}` : "none"
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
                        "relative flex min-h-[44px] min-w-[44px] size-full flex-col overflow-hidden rounded-[1.35rem] border border-[hsl(38,16%,86%)] bg-gradient-to-b from-white to-[hsl(38,28%,97%)] p-0 text-center sm:rounded-[1.5rem]",
                        "font-body text-[0.7rem] font-medium leading-tight tracking-[-0.01em] text-foreground sm:text-[0.8125rem]",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-[box-shadow,border-color,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        "[transform:translate3d(0,0,0.1px)] hover:[transform:translate3d(0,-5px,2px)] hover:border-[hsl(38,14%,74%)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.12),0_10px_30px_rgba(0,0,0,0.06)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38,25%,45%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(38,22%,96%)]",
                        "active:[transform:translate3d(0,-1px,0.1px)] active:scale-[0.98]"
                      )}
                      draggable={false}
                    >
                      <span
                        className="relative z-[1] block w-full shrink-0 overflow-hidden bg-neutral-950"
                        style={{
                          height: orbitImageSlotPx,
                          WebkitTransform: "translateZ(0.1px)",
                          transform: "translateZ(0.1px)",
                          backgroundColor: "#0a0a0a",
                          backgroundImage: `url(${JSON.stringify(item.imageSrc)})`,
                          backgroundSize: "contain",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat"
                        }}
                        role="img"
                        aria-label={item.imageAlt}
                      />
                      <span className="relative z-[1] flex min-h-0 flex-1 items-center justify-center border-t border-[hsl(38,16%,90%)] bg-gradient-to-b from-[hsl(38,28%,98%)] to-white px-1 py-1 text-balance sm:py-2 sm:text-[0.8125rem]">
                        {item.label}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 px-2 text-center text-[0.65rem] leading-relaxed text-muted-foreground sm:mt-10 sm:text-xs md:mt-14">
          Rotates automatically · Swipe or drag to explore · Tap a card to bring it forward · Tap again to open
        </p>
      </div>
    </section>
  );
}
