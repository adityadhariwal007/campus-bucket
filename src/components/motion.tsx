"use client";
import { useEffect } from "react";
import scripts from "@/lib/motion-scripts.json";
type Vars = Record<string, unknown>;
type Tween = { kill: () => void; timeScale: (n: number) => void };
type Trigger = {
  progress: number;
  getVelocity: () => number;
};
type MotionWindow = Window & {
  gsap?: {
    registerPlugin: (p: unknown) => void;
    context: (f: () => void) => { revert: () => void };
    fromTo: (el: unknown, from: Vars, to: Vars) => Tween;
    to: (el: unknown, to: Vars) => Tween;
    ticker: {
      add: (f: (t: number) => void) => void;
      remove: (f: (t: number) => void) => void;
    };
  };
  ScrollTrigger?: {
    create: (v: Vars) => { kill: () => void };
    update: () => void;
    refresh: () => void;
  };
  Lenis?: new (v: Vars) => {
    on: (e: string, cb: () => void) => void;
    raf: (t: number) => void;
    destroy: () => void;
  };
};
let loading: Promise<void> | undefined;
function loadScripts() {
  return (loading ??= (async () => {
    for (const spec of scripts)
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${spec.src}"]`,
        );
        if (existing?.dataset.loaded) {
          resolve();
          return;
        }
        const script = existing || document.createElement("script");
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => {
          script.remove();
          reject(new Error("Motion unavailable"));
        };
        if (!existing) {
          script.src = spec.src;
          script.integrity = spec.integrity;
          script.crossOrigin = "anonymous";
          const nonce =
            document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
          if (nonce) script.nonce = nonce;
          document.head.appendChild(script);
        }
      });
  })().catch((error) => {
    loading = undefined;
    throw error;
  }));
}
export function Motion({ refreshKey }: { refreshKey: string }) {
  useEffect(() => {
    let stopped = false;
    let cleanup: (() => void) | undefined;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    async function setup() {
      if (preference.matches) return;
      try {
        await loadScripts();
      } catch {
        return;
      } // Content stays usable if the CDN is blocked.
      if (stopped || preference.matches) return;
      const { gsap, ScrollTrigger, Lenis } = window as MotionWindow;
      if (!gsap || !ScrollTrigger || !Lenis) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({
        duration: 1,
        smoothWheel: true,
        anchors: true,
        prevent: (node: HTMLElement) => !!node.closest("dialog"),
      });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      const context = gsap.context(() => {
        gsap.fromTo(".why-sticky h2", { opacity: .8 }, { opacity: 1, scrollTrigger: { trigger: ".editorial-why", start: "top center", end: "center center", scrub: true } });
        document.querySelectorAll<HTMLElement>("[data-count]").forEach(el => {
          const end=Number(el.dataset.count); const counter={value:0};
          gsap.to(counter,{value:end,duration:1,ease:"expo.out",scrollTrigger:{trigger:el,start:"top 90%",once:true},onUpdate:()=>{el.textContent=String(Math.round(counter.value));}});
        });
        document
          .querySelectorAll(".why-stories .photo-frame img")
          .forEach((el) =>
            gsap.fromTo(
              el,
              { scale: 1.15 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement,
                  start: "top bottom",
                  end: "bottom center",
                  scrub: true,
                },
              },
            ),
          );
        const marquee = gsap.to(".marquee-track", {
          xPercent: -25,
          duration: 24,
          repeat: -1,
          ease: "none",
        });
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self: Trigger) => {
            document
              .querySelector<HTMLElement>(".scroll-progress")
              ?.style.setProperty("transform", `scaleX(${self.progress})`);
            marquee.timeScale(
              1 + Math.min(Math.abs(self.getVelocity()) / 1200, 2),
            );
          },
        });
        if (matchMedia("(min-width: 1024px)").matches) {
          const stage = document.querySelector(".unpack-stage");
          gsap.fromTo(
            ".unpack-item",
            { y: 150, scale: 0.65, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              stagger: 0.3,
              ease: "none",
              scrollTrigger: {
                trigger: stage,
                start: "top top+=80",
                end: "+=850",
                pin: true,
                scrub: 0.7,
              },
            },
          );
          const rail = document.querySelector<HTMLElement>(".kit-rail");
          const frame = document.querySelector<HTMLElement>(".kit-rail-window");
          if (rail && frame && rail.scrollWidth > frame.clientWidth)
            gsap.to(rail, {
              x: () => -(rail.scrollWidth - frame.clientWidth),
              ease: "none",
              scrollTrigger: {
                trigger: frame,
                start: "top top+=100",
                end: () => `+=${rail.scrollWidth - frame.clientWidth}`,
                pin: true,
                scrub: 0.7,
                invalidateOnRefresh: true,
              },
            });
          gsap.fromTo(
            ".bundle-stack-card",
            { y: 120, rotation: -12 },
            {
              y: 0,
              rotation: (i: number) => (i - 1) * 9,
              stagger: 0.15,
              scrollTrigger: {
                trigger: ".editorial-bundle",
                start: "top bottom",
                end: "center center",
                scrub: true,
              },
            },
          );
        }
      });
      const cursor = document.querySelector<HTMLElement>(".view-cursor");
      const pointer = (e: PointerEvent) => {
        if (!cursor || e.pointerType !== "mouse") return;
        const target = (e.target as Element).closest<HTMLElement>(
          "[data-cursor]",
        );
        cursor.textContent = target?.dataset.cursor || "";
        cursor.style.transform = `translate3d(${e.clientX + 16}px,${e.clientY + 16}px,0)`;
        cursor.style.opacity = target ? "1" : "0";
      };
      document.addEventListener("pointermove", pointer, { passive: true });
      ScrollTrigger.refresh();
      cleanup = () => {
        context.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
        document.removeEventListener("pointermove", pointer);
        if (cursor) cursor.style.opacity = "0";
      };
    }
    const change = () => {
      cleanup?.();
      cleanup = undefined;
      void setup();
    };
    preference.addEventListener("change", change);
    const start = () => { void setup(); };
    if (window.scrollY > 0) void setup();
    else window.addEventListener("scroll", start, { once: true, passive: true });
    return () => {
      window.removeEventListener("scroll", start);
      stopped = true;
      cleanup?.();
      preference.removeEventListener("change", change);
    };
  }, [refreshKey]);
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="view-cursor" aria-hidden="true" />
    </>
  );
}
