"use client";

import { useEffect, useRef, useState } from "react";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#01";

export default function GlitchText({ children }: { children: string }) {
  const [display, setDisplay] = useState(children);
  const original = children;
  const glitchFrames = useRef(0);

  useEffect(() => {
    let raf: number;

    const tick = () => {
      // Random chance to start glitch (same as datamhs: ~0.3% per tick)
      if (glitchFrames.current === 0 && Math.random() < 0.008) {
        glitchFrames.current = Math.floor(Math.random() * 5) + 3;
      }

      if (glitchFrames.current > 0) {
        const arr = original.split("");
        const numGlitches = Math.floor(Math.random() * (arr.length / 3)) + 1;
        for (let i = 0; i < numGlitches; i++) {
          const r = Math.floor(Math.random() * arr.length);
          if (arr[r] !== " ") {
            arr[r] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
        }
        setDisplay(arr.join(""));
        glitchFrames.current--;
      } else {
        setDisplay(original);
      }

      raf = window.setTimeout(tick, 50);
    };

    raf = window.setTimeout(tick, 50);
    return () => clearTimeout(raf);
  }, [original]);

  return <span className="gradient-text">{display}</span>;
}
