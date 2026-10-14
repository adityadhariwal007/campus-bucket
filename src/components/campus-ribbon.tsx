"use client";
import { ribbonProgress } from "@/lib/account-ui";
import { useEffect, useId, useRef } from "react";
export function CampusRibbon() {
  const id = useId().replace(/:/g, "");
  const frame = useRef<HTMLDivElement>(null);
  const reveal = useRef<SVGPathElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tick = 0;
    const draw = () => {
      tick = 0;
      if (!frame.current || !reveal.current) return;
      const rect = frame.current.getBoundingClientRect();
      const progress = ribbonProgress(rect.top, rect.height, innerHeight, reduced.matches);
      reveal.current.style.strokeDashoffset = String(1 - progress);
    };
    const schedule = () => { if (!tick) tick = requestAnimationFrame(draw); };
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(tick);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);
  return <div ref={frame} className="campus-ribbon" role="img" aria-label="Less packing. More living. Your next chapter starts here.">
    <svg viewBox="0 0 1200 370" aria-hidden="true">
      <defs>
        <path id={`${id}-curve`} d="M -40 70 C 240 -15, 650 25, 440 165 S 720 395, 1240 215" />
        <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" x="-60" y="-60" width="1320" height="450">
          <path ref={reveal} d="M -40 70 C 240 -15, 650 25, 440 165 S 720 395, 1240 215" pathLength="1" stroke="white" strokeWidth="70" fill="none" strokeDasharray="1" strokeDashoffset="0" />
        </mask>
      </defs>
      <g mask={`url(#${id}-reveal)`}>
        <use href={`#${id}-curve`} fill="none" stroke="var(--charcoal)" strokeWidth="58" />
        <text fill="var(--bone)" dominantBaseline="central"><textPath href={`#${id}-curve`} startOffset="5%">LESS PACKING. MORE LIVING. · YOUR NEXT CHAPTER STARTS HERE. · CAMPUS BUCKET ·</textPath></text>
      </g>
    </svg>
  </div>;
}
