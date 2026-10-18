"use client";
import React from "react";
import { cn } from "../../lib/utils";

export const InfiniteMovingCards = ({
  items = [],
  direction = "right",
  speed = "slow",
  pauseOnHover = true,
  className,
}) => {
  if (!items || items.length === 0) return null;

  // Set serene marquee duration based on speed
  let duration = "95s";
  if (speed === "fast") duration = "40s";
  else if (speed === "normal") duration = "65s";
  else if (speed === "slow") duration = "95s";

  // Duplicate items declaratively for pure seamless loop without DOM cloning bugs
  const displayItems = [...items, ...items];
  const isRight = direction === "right";

  return (
    <div className={cn("marquee-container max-w-7xl", className)}>
      <ul
        className={cn(
          "marquee-track py-6",
          isRight ? "marquee-right" : "marquee-left",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{
          "--marquee-duration": duration,
        }}
      >
        {displayItems.map((item, idx) => (
          <li
            key={`${item.name || "card"}-${idx}`}
            className="w-[340px] md:w-[440px] max-w-full shrink-0 relative rounded-2xl border border-slate-800/80 bg-[#060b17]/90 backdrop-blur-sm p-6 shadow-xl shadow-black/40 hover:border-blue-500/40 transition-colors"
          >
            <blockquote>
              <p className="text-sm leading-[1.7] text-slate-300 font-normal italic">
                "{item.quote}"
              </p>
              <div className="mt-6 flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 shrink-0">
                  {item.name ? item.name.charAt(0) : "N"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {item.title}
                  </span>
                </div>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};

