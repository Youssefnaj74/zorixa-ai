"use client";

import { motion } from "framer-motion";

const BLOBS = [
  { size: 280, x: "10%", y: "15%", delay: 0, duration: 14 },
  { size: 200, x: "70%", y: "20%", delay: 1, duration: 18 },
  { size: 320, x: "55%", y: "65%", delay: 2, duration: 16 },
  { size: 160, x: "25%", y: "70%", delay: 0.5, duration: 20 }
];

export function ParticleBackground() {
  return (
    <div className="particles-canvas" aria-hidden>
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-30 blur-3xl"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background:
              i % 2 === 0
                ? "radial-gradient(circle, rgba(131,56,235,0.55) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)"
          }}
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}
