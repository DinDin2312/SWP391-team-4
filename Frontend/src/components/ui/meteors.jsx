import React, { useMemo } from "react";

/**
 * Meteors that fall diagonally at 45° (top-left -> bottom-right) across the card.
 * Starts from the top-left corner/edges of the item.
 */
export const Meteors = ({ number = 8, className = "" }) => {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, idx) => {
        // Natural staggered speed: 3.5s to 6.5s
        const duration = 3.5 + Math.random() * 3;
        // Distribute spawn points along the top-left corner / entrance boundary:
        // Half start along the top-left top edge (-5% to 40%)
        // Half start along the top-left left edge (-8% to 0%, top 0% to 35%)
        const isTopEdge = idx % 2 === 0;
        const left = isTopEdge
          ? -5 + Math.random() * 45
          : -8 - Math.random() * 5;
        const top = isTopEdge
          ? -8 - Math.random() * 5
          : Math.random() * 35;

        return {
          left,
          top,
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
