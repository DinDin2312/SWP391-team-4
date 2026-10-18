import React, { useEffect, useRef, useState } from "react";
import { motion, useTransform, useMotionValue, useSpring } from "framer-motion";

export const TracingBeam = ({ children, className }) => {
  const ref = useRef(null);
  const contentRef = useRef(null);
  const [svgHeight, setSvgHeight] = useState(600);

  // Motion value for scroll progress (0 to 1)
  const scrollYProgress = useMotionValue(0);

  // Dynamic height detection using ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.offsetHeight;
        if (height > 50) {
          setSvgHeight(height);
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Listen to actual scroll parent (e.g. <main className="overflow-y-auto"> in MemberLayout or window)
  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    // Traverse upwards to find the scrollable container
    let parent = target.parentElement;
    let scrollContainer = window;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }

    const handleScroll = () => {
      if (!target) return;

      if (scrollContainer === window) {
        const rect = target.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const total = rect.height - windowHeight * 0.7;
        const current = -rect.top;
        const progress = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;
        scrollYProgress.set(progress);
      } else {
        const scrollTop = scrollContainer.scrollTop;
        const targetTop = target.offsetTop;
        const containerHeight = scrollContainer.clientHeight;
        const total = target.offsetHeight - containerHeight * 0.5;
        const current = scrollTop - targetTop;
        const progress = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;
        scrollYProgress.set(progress);
      }
    };

    // Calculate initial progress on mount
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [svgHeight, scrollYProgress]);

  // Smooth progress spring: baseline is 0.18 so the glowing beam is IMMEDIATELY VISIBLE at top,
  // then extends smoothly down to 1 as the user scrolls!
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 90,
  });

  const beamPathLength = useTransform(springProgress, [0, 1], [0.18, 1]);

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-5xl mx-auto pl-10 md:pl-14 ${className || ""}`}
    >
      {/* Safe, non-clipped left column for the beam (never pushed into negative margins) */}
      <div className="absolute left-1 md:left-2 top-2 bottom-0 w-8 pointer-events-none z-10 flex flex-col items-center">
        {/* Top Beacon Dot with glowing ping radar */}
        <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
          <span className="absolute w-7 h-7 rounded-full bg-cyan-400/25 animate-ping" />
          <span className="relative flex items-center justify-center w-4 h-4 rounded-full border-2 border-cyan-400 bg-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8]" />
          </span>
        </div>

        {/* SVG Track and Animated Beams */}
        <div className="relative w-8 flex-1 overflow-visible">
          <svg
            viewBox={`0 0 32 ${svgHeight}`}
            width="32"
            height={svgHeight}
            className="overflow-visible block w-8"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tracing-beam-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="35%" stopColor="#3b82f6" />
                <stop offset="70%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="tracing-pulse-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Background Rail (Clearly visible in both light & dark mode) */}
            <path
              d={`M 16 0 V ${svgHeight}`}
              fill="none"
              stroke="currentColor"
              className="text-slate-400/40 dark:text-slate-600/50"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Interactive Scroll-tracking Beam */}
            <motion.path
              d={`M 16 0 V ${svgHeight}`}
              fill="none"
              stroke="url(#tracing-beam-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                pathLength: beamPathLength,
                filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.75))",
              }}
            />

            {/* Continuous Running Energy Pulse ("Chạy" liên tục dọc theo line) */}
            <motion.path
              d={`M 16 0 V ${svgHeight}`}
              fill="none"
              stroke="url(#tracing-pulse-glow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="100 400"
              animate={{
                strokeDashoffset: [100, -Math.max(svgHeight, 600) - 100],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                filter: "drop-shadow(0 0 8px #00f2fe)",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  );
};