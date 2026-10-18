"use client";
import React from "react";
import { cn } from "../../lib/utils";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "aurora-wrapper",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "aurora-canvas",
            showRadialGradient && "aurora-mask-radial"
          )}
        />
        {/* Soft radial overlay for natural color blending */}
        <div className="absolute inset-0 bg-radial-gradient from-blue-500/[0.06] via-transparent to-transparent pointer-events-none" />
      </div>
      {children}
    </div>
  );
};

