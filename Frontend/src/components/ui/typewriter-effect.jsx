"use client";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import React from "react";

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}) => {
  // words is an array of objects: { text: "word", className: "optional-class" }
  const wordsArray = words.map((word) => {
    return {
      ...word,
      text: word.text.split(""),
    };
  });

  const renderWords = () => {
    return (
      <div className="flex">
        {wordsArray.map((word, idx) => {
          return (
            <div key={`word-${idx}`} className="inline-block">
              {word.text.map((char, index) => (
                <span
                  key={`char-${index}`}
                  className={cn("text-white font-black", word.className)}
                >
                  {char}
                </span>
              ))}
              &nbsp;
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("flex space-x-1 my-6 justify-center items-center", className)}>
      <motion.div
        className="overflow-hidden pb-2"
        initial={{ width: "0%" }}
        whileInView={{ width: "fit-content" }}
        viewport={{ once: true }}
        transition={{
          duration: 3.2,
          ease: "easeInOut",
          delay: 0.6,
        }}
      >
        <div
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
          style={{ whiteSpace: "nowrap" }}
        >
          {renderWords()}
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "block rounded-sm w-[4px] h-7 sm:h-10 md:h-12 lg:h-14 bg-blue-500",
          cursorClassName
        )}
      ></motion.span>
    </div>
  );
};
