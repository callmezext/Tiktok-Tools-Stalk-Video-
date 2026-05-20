"use client";

import { useEffect, useRef, useCallback } from "react";

export default function GlitchText({ children }: { children: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  const triggerGlitch = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    el.classList.remove("glitching");
    void el.offsetWidth;
    el.classList.add("glitching");

    setTimeout(() => {
      el.classList.remove("glitching");
    }, 600);
  }, []);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2500;
      timerId = setTimeout(() => {
        triggerGlitch();
        scheduleNext();
      }, delay);
    };

    timerId = setTimeout(() => {
      triggerGlitch();
      scheduleNext();
    }, 800);

    return () => clearTimeout(timerId);
  }, [triggerGlitch]);

  return (
    <>
      <style>{`
        /* ═══ Cyberpunk Glitch Container ═══ */
        .cyber-glitch {
          position: relative;
          display: inline-block;
          --neon-cyan: #00F0FF;
          --neon-magenta: #FF2D7B;
          --neon-purple: #A855F7;
        }

        /* ── Base text: neon glow ── */
        .cyber-base {
          position: relative;
          z-index: 2;
          background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple), var(--neon-magenta));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.3))
                  drop-shadow(0 0 20px rgba(168, 85, 247, 0.2));
          animation: cyber-idle-flicker 4s ease-in-out infinite;
        }

        /* ── Scanline overlay ── */
        .cyber-glitch::before {
          content: '';
          position: absolute;
          top: 0;
          left: -5%;
          width: 110%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(0, 240, 255, 0.03) 2px,
            rgba(0, 240, 255, 0.03) 4px
          );
          pointer-events: none;
          z-index: 10;
          mix-blend-mode: overlay;
        }

        /* ── Chromatic aberration layers ── */
        .cyber-copy {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          user-select: none;
          opacity: 0;
          z-index: 3;
          -webkit-text-fill-color: initial;
        }

        /* Cyan layer — clips top portion */
        .cyber-copy-1 {
          color: var(--neon-cyan);
          text-shadow: 0 0 10px var(--neon-cyan), 0 0 30px rgba(0, 240, 255, 0.4);
          clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
        }

        /* Magenta layer — clips bottom portion */
        .cyber-copy-2 {
          color: var(--neon-magenta);
          text-shadow: 0 0 10px var(--neon-magenta), 0 0 30px rgba(255, 45, 123, 0.4);
          clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
        }

        /* Purple mid-layer — clips center */
        .cyber-copy-3 {
          color: var(--neon-purple);
          text-shadow: 0 0 8px var(--neon-purple);
          clip-path: polygon(0 35%, 100% 35%, 100% 65%, 0 65%);
        }

        /* ═══ Idle state — subtle flicker ═══ */
        @keyframes cyber-idle-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.9; }
          97% { opacity: 1; }
        }

        /* ═══ GLITCH ACTIVE ═══ */

        /* Base jitter — skew + translate */
        .cyber-glitch.glitching .cyber-base {
          animation: cyber-jitter 600ms steps(8) forwards;
        }

        /* Cyan slice — aggressive offset */
        .cyber-glitch.glitching .cyber-copy-1 {
          opacity: 0.9;
          animation: cyber-slice-cyan 600ms steps(6) forwards;
        }

        /* Magenta slice — opposite offset */
        .cyber-glitch.glitching .cyber-copy-2 {
          opacity: 0.85;
          animation: cyber-slice-magenta 600ms steps(6) forwards;
        }

        /* Purple mid-slice — subtle */
        .cyber-glitch.glitching .cyber-copy-3 {
          opacity: 0.7;
          animation: cyber-slice-purple 600ms steps(4) forwards;
        }

        /* ── Keyframes ── */
        @keyframes cyber-jitter {
          0%   { transform: translate(0) skewX(0deg); filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.3)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.2)); }
          12%  { transform: translate(-3px, -1px) skewX(-2deg); filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.5)) drop-shadow(0 0 25px rgba(168, 85, 247, 0.3)); }
          25%  { transform: translate(4px, 1px) skewX(1deg); }
          37%  { transform: translate(-2px, 0) skewX(-3deg); filter: drop-shadow(0 0 16px rgba(255, 45, 123, 0.4)); }
          50%  { transform: translate(1px, -1px) skewX(0deg); }
          62%  { transform: translate(-4px, 2px) skewX(2deg); filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.6)); }
          75%  { transform: translate(2px, 0) skewX(-1deg); }
          87%  { transform: translate(-1px, 1px) skewX(0deg); }
          100% { transform: translate(0) skewX(0deg); filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.3)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.2)); }
        }

        @keyframes cyber-slice-cyan {
          0%   { transform: translate(-12px, -2px) skewX(-4deg); opacity: 0.95; clip-path: polygon(0 0, 100% 0, 100% 45%, 0 40%); }
          16%  { transform: translate(8px, 1px) skewX(2deg);    opacity: 0.8;  clip-path: polygon(0 5%, 100% 0, 100% 35%, 0 38%); }
          33%  { transform: translate(-15px, 0) skewX(-6deg);   opacity: 0.9;  clip-path: polygon(0 0, 100% 0, 100% 42%, 0 42%); }
          50%  { transform: translate(6px, -1px) skewX(3deg);   opacity: 0.7;  clip-path: polygon(0 3%, 100% 0, 100% 38%, 0 35%); }
          66%  { transform: translate(-8px, 2px) skewX(-2deg);  opacity: 0.85; }
          83%  { transform: translate(3px, 0) skewX(1deg);      opacity: 0.4; }
          100% { transform: translate(0) skewX(0deg);           opacity: 0; }
        }

        @keyframes cyber-slice-magenta {
          0%   { transform: translate(10px, 2px) skewX(3deg);   opacity: 0.9;  clip-path: polygon(0 55%, 100% 60%, 100% 100%, 0 100%); }
          16%  { transform: translate(-7px, -1px) skewX(-4deg); opacity: 0.85; clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 100%); }
          33%  { transform: translate(14px, 1px) skewX(5deg);   opacity: 0.9;  clip-path: polygon(0 58%, 100% 55%, 100% 100%, 0 100%); }
          50%  { transform: translate(-5px, 0) skewX(-2deg);    opacity: 0.7; }
          66%  { transform: translate(8px, -2px) skewX(3deg);   opacity: 0.8; }
          83%  { transform: translate(-3px, 1px) skewX(-1deg);  opacity: 0.3; }
          100% { transform: translate(0) skewX(0deg);           opacity: 0; }
        }

        @keyframes cyber-slice-purple {
          0%   { transform: translate(5px, 0) skewX(2deg);   opacity: 0.6; }
          25%  { transform: translate(-8px, 1px) skewX(-3deg); opacity: 0.75; }
          50%  { transform: translate(6px, -1px) skewX(4deg);  opacity: 0.5; }
          75%  { transform: translate(-3px, 0) skewX(-1deg);   opacity: 0.3; }
          100% { transform: translate(0) skewX(0deg);          opacity: 0; }
        }

        /* ── Neon glow burst on glitch ── */
        .cyber-glitch.glitching::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 200%;
          background: radial-gradient(ellipse, rgba(0, 240, 255, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
          animation: cyber-glow-burst 600ms ease-out forwards;
        }

        @keyframes cyber-glow-burst {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>

      <span ref={wrapRef} className="cyber-glitch">
        {/* Base text — neon gradient */}
        <span className="cyber-base">{children}</span>

        {/* Chromatic layer 1 — Cyan top slice */}
        <span className="cyber-copy cyber-copy-1" aria-hidden="true">
          {children}
        </span>

        {/* Chromatic layer 2 — Magenta bottom slice */}
        <span className="cyber-copy cyber-copy-2" aria-hidden="true">
          {children}
        </span>

        {/* Chromatic layer 3 — Purple mid slice */}
        <span className="cyber-copy cyber-copy-3" aria-hidden="true">
          {children}
        </span>
      </span>
    </>
  );
}
