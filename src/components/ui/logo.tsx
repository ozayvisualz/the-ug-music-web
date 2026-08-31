"use client";

/**
 * The official TheUgMusic brand mark (public/icon.svg).
 * Single source of truth for the logo — reuse this instead of inline icons.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/icon.svg"
      alt="TheUgMusic"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-lg flex-shrink-0 ${className}`}
    />
  );
}
