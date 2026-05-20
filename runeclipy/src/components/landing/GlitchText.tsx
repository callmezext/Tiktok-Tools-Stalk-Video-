"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#&%$!?+=";

export default function GlitchText({ children }: { children: string }) {
  const [display, setDisplay] = useState(children);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const originalText = children;

  const scramble = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    const chars = originalText.split("");
    const total = 24;
    let frame = 0;

    // each char resolves at a staggered frame
    const resolve = chars.map((_, i) =>
      Math.floor((i / chars.length) * total * 0.65) + Math.floor(Math.random() * 5)
    );

    const tick = () => {
      frame++;
      const out = chars.map((ch, i) => {
        if (ch === " ") return " ";
        if (frame >= resolve[i]) return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      });
      setDisplay(out.join(""));

      if (frame < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(originalText);
        busyRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [originalText]);

  useEffect(() => {
    const t = setTimeout(() => scramble(), 800);
    const iv = setInterval(() => scramble(), 4000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scramble]);

  return <span className="gradient-text">{display}</span>;
}
