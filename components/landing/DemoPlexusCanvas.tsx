"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number };

const BG_OUTER = "#000000";
const CYAN = "rgba(0, 229, 229, 0.92)";
const CYAN_SOFT = "rgba(0, 245, 245, 0.88)";

function clampParticles(w: number, h: number, list: Particle[]): Particle[] {
  const target = Math.max(32, Math.min(96, Math.floor((w * h) / 8200)));
  while (list.length < target) {
    const speed = 0.12 + Math.random() * 0.22;
    const a = Math.random() * Math.PI * 2;
    list.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed
    });
  }
  while (list.length > target) list.pop();
  return list;
}

export function DemoPlexusCanvas({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1e6, y: -1e6 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = clampParticles(w, h, particlesRef.current);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1e6, y: -1e6 };
    };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);

    const drawBackground = () => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.max(w, h) * 0.72;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, "rgba(0, 55, 58, 0.55)");
      g.addColorStop(0.28, "rgba(0, 28, 32, 0.42)");
      g.addColorStop(0.55, "rgba(0, 12, 18, 0.25)");
      g.addColorStop(1, BG_OUTER);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const drawGrid = () => {
      const step = Math.max(36, Math.round(Math.min(w, h) / 14));
      ctx.strokeStyle = "rgba(0, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += step) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();
    };

    const tick = () => {
      const particles = particlesRef.current;
      const connectDist = Math.min(150, Math.max(88, Math.min(w, h) * 0.19));
      const connectSq = connectDist * connectDist;
      const { x: mx, y: my } = mouseRef.current;

      drawBackground();
      drawGrid();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        const margin = 4;
        if (p.x < margin) {
          p.x = margin;
          p.vx *= -1;
        } else if (p.x > w - margin) {
          p.x = w - margin;
          p.vx *= -1;
        }
        if (p.y < margin) {
          p.y = margin;
          p.vy *= -1;
        } else if (p.y > h - margin) {
          p.y = h - margin;
          p.vy *= -1;
        }

        const mdx = p.x - mx;
        const mdy = p.y - my;
        const mDistSq = mdx * mdx + mdy * mdy;
        const influence = 140 * 140;
        if (mDistSq < influence && mDistSq > 1) {
          const mDist = Math.sqrt(mDistSq);
          const push = ((140 - mDist) / 140) * 0.045;
          p.vx += (mdx / mDist) * push;
          p.vy += (mdy / mDist) * push;
        }

        const spd = Math.hypot(p.vx, p.vy);
        const cap = 0.55;
        if (spd > cap) {
          p.vx = (p.vx / spd) * cap;
          p.vy = (p.vy / spd) * cap;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < connectSq && dSq > 0) {
            const d = Math.sqrt(dSq);
            const t = 1 - d / connectDist;
            ctx.strokeStyle = `rgba(0, 229, 229, ${t * 0.38})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = CYAN_SOFT;
        ctx.shadowColor = "rgba(0, 255, 255, 0.9)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const padX = Math.max(12, w * 0.06);
      const maxTextW = Math.max(40, w - padX * 2);

      const titleLetterEm = Math.min(0.28, Math.max(0.06, w * 0.0018));
      let titleSize = Math.min(44, w * 0.065);
      const titleStr = "ZORIXA AI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = CYAN;
      while (titleSize >= 11) {
        ctx.font = `600 ${titleSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.letterSpacing = `${titleLetterEm}em`;
        if (ctx.measureText(titleStr).width <= maxTextW) break;
        titleSize -= 0.5;
      }

      const subLetterEm = Math.min(0.28, Math.max(0.08, w * 0.0014));
      let subSize = Math.min(16, w * 0.026);
      const subStr = "CINEMATIC INTELLIGENCE";
      while (subSize >= 8) {
        ctx.font = `500 ${subSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.letterSpacing = `${subLetterEm}em`;
        if (ctx.measureText(subStr).width <= maxTextW) break;
        subSize -= 0.5;
      }

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = CYAN;
      ctx.font = `600 ${titleSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.letterSpacing = `${titleLetterEm}em`;
      ctx.fillText(titleStr, w * 0.5, h * 0.5 - titleSize * 0.35);
      ctx.font = `500 ${subSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.letterSpacing = `${subLetterEm}em`;
      ctx.fillStyle = "rgba(0, 229, 229, 0.88)";
      ctx.fillText(subStr, w * 0.5, h * 0.5 + titleSize * 0.42);
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
