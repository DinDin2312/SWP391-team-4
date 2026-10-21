import React, { useMemo } from "react";

/**
 * Meteors that fall diagonally at 45° (top-left -> bottom-right) across the card.
 * Starts from the top-left corner/edges of the item.
 * Uses deterministic staggered offsets to avoid non-cryptographic PRNG warnings (SonarQube S2245).
 */
export const Meteors = ({ number = 8, className = "" }) => {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, idx) => {
        // Natural staggered speed: 3.6s to 6.0s
        const duration = 3.6 + ((idx * 7) % 5) * 0.6;
        // Distribute spawn points along the top-left corner / entrance boundary:
        // Alternates between the top edge (-5% to 28%) and left edge (9% to 28%)
        const isTopEdge = idx % 2 === 0;
        const left = isTopEdge
          ? -5 + ((idx * 13) % 45)
          : -8 - ((idx * 3) % 6);
        const top = isTopEdge
          ? -8 - ((idx * 2) % 6)
          : ((idx * 9) % 35);

        return {
          left,
          top,
          duration,
          delay: -((idx * 1.5) % duration),
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
