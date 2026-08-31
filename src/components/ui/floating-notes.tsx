"use client";

import { useMemo } from "react";

const NOTE_CHARS = ["♪", "♫", "♬", "🎵", "🎶"];

type Bubble = {
  id: number;
  char: string;
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  rotation: number;
};

function generateBubbles(count: number): Bubble[] {
  const arr: Bubble[] = [];
  for (let i = 0; i < count; i++) {
    const layer = i % 3;
    arr.push({
      id: i,
      char: NOTE_CHARS[i % NOTE_CHARS.length],
      x: Math.random() * 100,
      size: 12 + Math.random() * 12 + layer * 3.5,
      opacity: 0.1 + Math.random() * 0.14 + layer * 0.05,
      duration: 9000 + Math.random() * 12000 - layer * 2200,
      delay: Math.random() * 7000,
      drift: 8 + Math.random() * (16 + layer * 10),
      rotation: Math.random() * 360,
    });
  }
  return arr;
}

/**
 * Decorative floating music-note bubbles (matching the mobile app). Renders an
 * absolute-fill, non-interactive layer — safe to drop behind any content.
 */
export default function FloatingNotes({ count = 34, rise = "100vh" }: { count?: number; rise?: string }) {
  const bubbles = useMemo(() => generateBubbles(count), [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="note-float"
          style={
            {
              left: `${b.x}%`,
              fontSize: b.size,
              animationDuration: `${b.duration}ms`,
              animationDelay: `${b.delay}ms`,
              "--note-rise": rise,
              "--note-opacity": b.opacity,
              "--note-drift": `${b.drift}px`,
              "--note-rot": `${b.rotation}deg`,
            } as React.CSSProperties
          }
        >
          <span className="note-sway" style={{ animationDuration: `${b.duration / 2}ms` }}>
            {b.char}
          </span>
        </span>
      ))}
    </div>
  );
}
