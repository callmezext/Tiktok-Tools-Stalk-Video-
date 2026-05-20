"use client";

import { useEffect, useRef } from "react";

// Social media SVG icons as path data
const ICONS = [
  // TikTok
  { path: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.82 4.48 6.3 6.3 0 001.86-4.48V8.74a8.18 8.18 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.17z", color: "#A78BFA" },
  // Instagram
  { path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z", color: "#EC4899" },
  // YouTube
  { path: "M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.68 31.68 0 000 12a31.68 31.68 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.68 31.68 0 0024 12a31.68 31.68 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z", color: "#EF4444" },
  // Music note
  { path: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z", color: "#10B981" },
  // Heart
  { path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z", color: "#F43F5E" },
  // Play button
  { path: "M5 3l14 9-14 9V3z", color: "#8B5CF6" },
  // Camera
  { path: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4.5 4.5 0 100-9 4.5 4.5 0 000 9z", color: "#3B82F6" },
  // Star
  { path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", color: "#F59E0B" },
  // Share
  { path: "M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98", color: "#06B6D4" },
  // Trending
  { path: "M23 6l-9.5 9.5-5-5L1 18", color: "#A78BFA" },
  // Dollar
  { path: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", color: "#10B981" },
  // Lightning
  { path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", color: "#FBBF24" },
];

interface FloatingIcon {
  x: number;
  y: number;
  size: number;
  speed: number; // parallax multiplier
  opacity: number;
  rotation: number;
  rotSpeed: number;
  iconIdx: number;
  depth: number; // 0=far, 1=mid, 2=near
}

function generateIcons(count: number): FloatingIcon[] {
  const icons: FloatingIcon[] = [];
  for (let i = 0; i < count; i++) {
    const depth = i % 3;
    const sizeBase = depth === 0 ? 16 : depth === 1 ? 22 : 30;
    icons.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: sizeBase + Math.random() * 10,
      speed: depth === 0 ? 0.02 : depth === 1 ? 0.05 : 0.09,
      opacity: depth === 0 ? 0.06 : depth === 1 ? 0.1 : 0.15,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      iconIdx: Math.floor(Math.random() * ICONS.length),
      depth,
    });
  }
  return icons;
}

export default function ParallaxBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iconsRef = useRef<FloatingIcon[]>(generateIcons(28));
  const scrollRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const scroll = scrollRef.current;

      iconsRef.current.forEach((icon) => {
        // Parallax offset based on scroll
        const yOffset = scroll * icon.speed;
        const px = (icon.x / 100) * w;
        const py = ((icon.y / 100) * h - yOffset) % (h + 100);
        const finalY = py < -50 ? py + h + 100 : py;

        // Slow rotation
        icon.rotation += icon.rotSpeed;

        ctx.save();
        ctx.translate(px, finalY);
        ctx.rotate((icon.rotation * Math.PI) / 180);
        ctx.globalAlpha = icon.opacity;

        // Draw SVG path
        const iconData = ICONS[icon.iconIdx];
        const scale = icon.size / 24;
        ctx.scale(scale, scale);
        ctx.translate(-12, -12); // center the 24x24 viewBox

        const p = new Path2D(iconData.path);
        ctx.strokeStyle = iconData.color;
        ctx.lineWidth = 1.5 / scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = "transparent";
        ctx.stroke(p);

        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
