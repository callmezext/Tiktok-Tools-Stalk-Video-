"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ";

export default function GlitchText({ children }: { children: string }) {
  const [display, setDisplay] = useState(children);
  const [isGlitching, setIsGlitching] = useState(false);
  const frameRef = useRef<number>(0);
  const originalText = children;

  const scramble = useCallback(() => {
    if (isGlitching) return;
    setIsGlitching(true);

    const totalFrames = 20;
    const chars = originalText.split("");
    let frame = 0;

    // Each character has its own "lock-in" frame
    const lockFrames = chars.map((_, i) =>
      Math.floor((i / chars.length) * totalFrames * 0.7) + Math.floor(Math.random() * 4)
    );

    const tick = () => {
      frame++;
      const result = chars.map((char, i) => {
        if (char === " ") return " ";
        if (frame >= lockFrames[i]) return char; // resolved
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      });
      setDisplay(result.join(""));

      if (frame < totalFrames) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(originalText);
        setIsGlitching(false);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [originalText, isGlitching]);

  useEffect(() => {
    // Initial scramble on mount
    const initTimer = setTimeout(() => scramble(), 600);

    // Recurring scramble
    const interval = setInterval(() => {
      scramble();
    }, 3500 + Math.random() * 2000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      cancelAnimationFrame(frameRef.current);
    };
  }, [scramble]);

  return (
    <>
      <style>{`
        .cyber-text {
          position: relative;
          display: inline;
          background: linear-gradient(135deg, #00F0FF, #A855F7, #FF2D7B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.25))
                  drop-shadow(0 0 16px rgba(168, 85, 247, 0.15));
        }

        .cyber-text.scrambling {
          animation: cyber-flash 150ms steps(2) infinite;
        }

        @keyframes cyber-flash {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.25))
                    drop-shadow(0 0 16px rgba(168, 85, 247, 0.15));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.45))
                    drop-shadow(0 0 24px rgba(168, 85, 247, 0.3));
          }
        }
      `}</style>
      <span className={`cyber-text ${isGlitching ? "scrambling" : ""}`}>
        {display}
      </span>
    </>
  );
}
