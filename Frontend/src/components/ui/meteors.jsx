import React, { useMemo } from "react";

/**
 * Meteors that fall diagonally (top-left -> bottom-right) across the WHOLE card.
 * - Self-contained clipping layer (absolute inset-0 overflow-hidden), so the parent
 *   only needs `position: relative`.
 * - Spawn positions are in % of the card, spread evenly, so they cover the card
 *   regardless of its width/height (old version used fixed px from the top edge only,
 *   which made meteors cluster in the top-right corner).
 * - Negative delays: meteors are already mid-flight on mount, no static dots waiting.
 */
export const Meteors = ({ number = 8, className = "" }) => {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, idx) => {
        const duration = 14 + Math.random() * 6; // 14s - 20s: calm glide
        return {
          // Near-vertical fall with slight right drift (~70% of card width over its full
          // height), so spread starts evenly from -40% to 95% of the card width.
          left: -40 + (idx / Math.max(number - 1, 1)) * 135 + (Math.random() * 8 - 4),
          top: -15 + Math.random() * 35, // -15% .. 20% of card height
          duration,
          delay: -Math.random() * duration,
        };
      }),
    [number]
  );

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none z-0"
    >
      {meteors.map((m, idx) => (
        <span
          key={"meteor" + idx}
          className={`nexus-meteor ${className}`}
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
};