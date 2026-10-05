"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  useEffect(() => {
    if (scope.current) {
      animate("span", {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      }, {
        duration: duration ? duration : 1,
        delay: stagger(0.2),
      });
    }
  }, [animate, filter, duration]);

  const renderWords = () => {
    return (
      <motion.span ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-white opacity-0 inline-block mr-2"
              style={{
                filter: filter ? "blur(10px)" : "none",
              }}>
              {word}
            </motion.span>
          );
        })}
      </motion.span>
    );
  };

  return (
    <h2 className={cn("font-bold", className)}>
      {renderWords()}
    </h2>
  );
};