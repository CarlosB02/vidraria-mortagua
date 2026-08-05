"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Position coordinates using motion values for smoother frame-by-frame updates
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Springs for the outer ring to create the "glass drag" effect
  const ringX = useSpring(cursorX, { stiffness: 180, damping: 20 });
  const ringY = useSpring(cursorY, { stiffness: 180, damping: 20 });

  useEffect(() => {
    // Detect mobile touch pointer devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      const timer = setTimeout(() => setIsTouchDevice(true), 0);
      return () => clearTimeout(timer);
    }

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const isInteractive = 
        e.target.tagName.toLowerCase() === "a" ||
        e.target.tagName.toLowerCase() === "button" ||
        e.target.tagName.toLowerCase() === "input" ||
        e.target.tagName.toLowerCase() === "textarea" ||
        e.target.tagName.toLowerCase() === "select" ||
        e.target.closest("a") ||
        e.target.closest("button") ||
        e.target.closest("[role='button']") ||
        e.target.classList.contains("interactive-glass");

      setIsHovered(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible, cursorX, cursorY]);

  if (isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Inner Dot following cursor instantly */}
      <motion.div
        className={styles.cursorDot}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.0 : 1,
          backgroundColor: isHovered ? "var(--foreground)" : "var(--accent-cyan)",
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Outer Glass Ring following with spring lag */}
      <motion.div
        className={styles.cursorRing}
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.2 : 1,
          borderColor: isHovered ? "var(--accent-cyan)" : "rgba(6, 182, 212, 0.4)",
          background: isHovered ? "rgba(6, 182, 212, 0.08)" : "rgba(6, 182, 212, 0.03)",
          backdropFilter: isHovered ? "blur(3px)" : "blur(1px)",
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
