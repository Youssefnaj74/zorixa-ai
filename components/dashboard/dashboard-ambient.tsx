"use client";

import { motion } from "framer-motion";

const ORBS = [
  { size: 420, x: "12%", y: "8%", color: "rgba(139, 92, 246, 0.45)", blur: 80, duration: 22 },
  { size: 340, x: "72%", y: "12%", color: "rgba(99, 102, 241, 0.35)", blur: 70, duration: 18 },
  { size: 280, x: "55%", y: "58%", color: "rgba(168, 85, 247, 0.3)", blur: 60, duration: 26 },
  { size: 200, x: "8%", y: "62%", color: "rgba(59, 130, 246, 0.22)", blur: 50, duration: 20 }
] as const;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 23 + 7) % 100}%`,
  size: 2 + (i % 3),
  delay: (i * 0.12) % 4,
  duration: 10 + (i % 5) * 2
}));

export function DashboardAmbient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(145deg, #0c0618 0%, #0a0a0f 38%, #0a0a0f 100%)",
            "linear-gradient(155deg, #12081f 0%, #0a0a0f 42%, #080612 100%)",
            "linear-gradient(135deg, #0e0716 0%, #0a0a0f 40%, #0a0a0f 100%)",
            "linear-gradient(145deg, #0c0618 0%, #0a0a0f 38%, #0a0a0f 100%)"
          ]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.35),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(99,102,241,0.12),transparent)]" />

      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`,
            filter: `blur(${orb.blur}px)`
          }}
          animate={{
            x: [0, 24, -16, 0],
            y: [0, -20, 12, 0],
            scale: [1, 1.06, 0.98, 1],
            opacity: [0.55, 0.75, 0.6, 0.55]
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8
          }}
        />
      ))}

      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-violet-300/25 shadow-[0_0_12px_rgba(167,139,250,0.35)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.15, 0.45, 0.15],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay
          }}
        />
      ))}
    </div>
  );
}
