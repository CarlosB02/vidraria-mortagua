"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, Sun, Shield, Wind, Layers, Truck, Wrench, Headset } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values to drive the 3D rotation of the glass panel
  const rotateX = useMotionValue(15);
  const rotateY = useMotionValue(-20);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Calculate mouse position relative to the visual section container center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Map mouse position to degree rotations
      // Max 30 degrees rotation
      const factorX = (mouseY / (rect.height / 2)) * -12;
      const factorY = (mouseX / (rect.width / 2)) * 15;

      rotateX.set(factorX + 15); // Offset by default initial tilts
      rotateY.set(factorY - 20);
    };

    const handleMouseLeave = () => {
      // Return slowly to defaults
      rotateX.set(15);
      rotateY.set(-20);
    };

    const visualSection = document.getElementById("hero-visual");
    if (visualSection) {
      visualSection.addEventListener("mousemove", handleMouseMove);
      visualSection.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (visualSection) {
        visualSection.removeEventListener("mousemove", handleMouseMove);
        visualSection.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [rotateX, rotateY]);

  // Framer Motion staggered animation configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section id="inicio" className={styles.hero} ref={containerRef}>
      {/* Background blueprint lines */}
      <div className="grid-bg" />
      <div className="radial-glow" />

      <div className="container">
        <div className={styles.heroContent}>
          {/* Hero text branding */}
          <motion.div
            className={styles.textSection}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className={styles.title} variants={itemVariants}>
              MOLDAMOS A<br />
              <span className={styles.titleHighlight}>TRANSPARÊNCIA.</span>
            </motion.h1>

            <motion.p className={styles.description} variants={itemVariants}>
              Produzimos soluções em vidro para projetos onde qualidade, tecnologia e fiabilidade fazem a diferença.
            </motion.p>

            <motion.div className={styles.actions} variants={itemVariants}>
              <a href="#produtos" className={styles.primaryBtn}>
                <span>Explorar Produtos</span>
                <ArrowUpRight size={16} />
              </a>
              <a href="#contactos" className={styles.secondaryBtn}>
                <span>Iniciar um Projeto</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Interactive 3D Glass Layer Visual representation */}
          <motion.div
            id="hero-visual"
            className={styles.visualSection}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={styles.blueprintFrame}>
              <div className={`${styles.blueprintCrosshair} ${styles.topRight}`} />
              <div className={`${styles.blueprintCrosshair} ${styles.bottomLeft}`} />
            </div>

            <div className={styles.unitWrapper}>
              <motion.div
                className={styles.glassUnit}
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
                animate={isHovered ? "expanded" : "collapsed"}
                initial="collapsed"
              >
                {/* 3D Exploded Depth Connector Lines */}
                <motion.div
                  className={styles.cornerLine}
                  style={{ top: 0, left: 0 }}
                  variants={{
                    collapsed: { width: 30, z: -15, rotateY: 90, transformOrigin: "left center", opacity: 0.1 },
                    expanded: { width: 120, z: -60, rotateY: 90, transformOrigin: "left center", opacity: 0.5 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
                <motion.div
                  className={styles.cornerLine}
                  style={{ top: 0, right: 0 }}
                  variants={{
                    collapsed: { width: 30, z: -15, rotateY: -90, transformOrigin: "right center", opacity: 0.1 },
                    expanded: { width: 120, z: -60, rotateY: -90, transformOrigin: "right center", opacity: 0.5 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
                <motion.div
                  className={styles.cornerLine}
                  style={{ bottom: 0, left: 0 }}
                  variants={{
                    collapsed: { width: 30, z: -15, rotateY: 90, transformOrigin: "left center", opacity: 0.1 },
                    expanded: { width: 120, z: -60, rotateY: 90, transformOrigin: "left center", opacity: 0.5 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
                <motion.div
                  className={styles.cornerLine}
                  style={{ bottom: 0, right: 0 }}
                  variants={{
                    collapsed: { width: 30, z: -15, rotateY: -90, transformOrigin: "right center", opacity: 0.1 },
                    expanded: { width: 120, z: -60, rotateY: -90, transformOrigin: "right center", opacity: 0.5 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />

                {/* Back Pane - Laminated Safety Glass */}
                <motion.div
                  className={`${styles.glassPane} ${styles.backPane}`}
                  variants={{
                    collapsed: { z: -15, opacity: 0.95 },
                    expanded: { z: -60, opacity: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  <div className={styles.paneStamp}>LAMI 44.2 (EN 14449)</div>
                  <div className={styles.glassReflection} />
                  <div className={styles.paneIndicator} style={{ bottom: "20px", left: "20px" }}>
                    <Shield size={16} />
                  </div>
                </motion.div>

                {/* Spacer Frame & Argon Gas Chamber */}
                <motion.div
                  className={styles.spacerFrame}
                  variants={{
                    collapsed: { z: 0, scaleZ: 0.8, opacity: 0.6 },
                    expanded: { z: 0, scaleZ: 2.0, opacity: 0.9 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className={styles.spacerBorder} />
                  <motion.div
                    className={styles.argonGlow}
                    animate={{
                      opacity: isHovered ? [0.15, 0.45, 0.15] : 0.08,
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                  <div className={styles.spacerStamp}>ARGON GÁS (16mm)</div>
                </motion.div>

                {/* Front Pane - Low-E Solar Control Glass */}
                <motion.div
                  className={`${styles.glassPane} ${styles.frontPane}`}
                  variants={{
                    collapsed: { z: 15, opacity: 0.95 },
                    expanded: { z: 60, opacity: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  <div className={styles.paneStamp}>LOW-E TEMP (6mm)</div>
                  <div className={styles.glassReflection} />
                  <div className={styles.paneIndicator} style={{ top: "20px", right: "20px" }}>
                    <Sun size={16} />
                  </div>
                </motion.div>

                {/* Desktop HUD Tooltips */}
                {/* Tooltip 1: Front Pane */}
                <motion.div
                  className={`${styles.techTooltip} ${styles.tooltipFront}`}
                  variants={{
                    collapsed: { opacity: 0, x: 20, pointerEvents: "none" },
                    expanded: { opacity: 1, x: 0, pointerEvents: "auto" }
                  }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  style={{ transform: "translateZ(60px)", top: "10%" }}
                >
                  <div className={styles.tooltipLine} />
                  <div className={styles.tooltipContent}>
                    <div className={styles.tooltipHeader}>
                      <Truck size={14} className={styles.tooltipIcon} />
                      <span>Entrega Rápida</span>
                    </div>
                    <p>Logística eficiente para garantir os prazos do seu projeto.</p>
                  </div>
                </motion.div>

                {/* Tooltip 2: Argon Chamber */}
                <motion.div
                  className={`${styles.techTooltip} ${styles.tooltipChamber}`}
                  variants={{
                    collapsed: { opacity: 0, x: 20, pointerEvents: "none" },
                    expanded: { opacity: 1, x: 0, pointerEvents: "auto" }
                  }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  style={{ transform: "translateZ(0px)", top: "50%", translateY: "-50%" }}
                >
                  <div className={styles.tooltipLine} />
                  <div className={styles.tooltipContent}>
                    <div className={styles.tooltipHeader}>
                      <Wrench size={14} className={styles.tooltipIcon} />
                      <span>Montagem Especializada</span>
                    </div>
                    <p>Equipas certificadas para uma instalação de excelência.</p>
                  </div>
                </motion.div>

                {/* Tooltip 3: Back Pane */}
                <motion.div
                  className={`${styles.techTooltip} ${styles.tooltipBack}`}
                  variants={{
                    collapsed: { opacity: 0, x: 20, pointerEvents: "none" },
                    expanded: { opacity: 1, x: 0, pointerEvents: "auto" }
                  }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  style={{ transform: "translateZ(-60px)", bottom: "10%" }}
                >
                  <div className={styles.tooltipLine} />
                  <div className={styles.tooltipContent}>
                    <div className={styles.tooltipHeader}>
                      <Headset size={14} className={styles.tooltipIcon} />
                      <span>Apoio Pós-Venda</span>
                    </div>
                    <p>Acompanhamento contínuo e garantia de satisfação total.</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Mobile Feature List - Hidden on desktop, shown on mobile below the visual */}
            <div className={styles.mobileTechList}>
              <div className={styles.mobileTechItem}>
                <div className={styles.mobileIconWrapper}>
                  <Truck size={18} />
                </div>
                <div className={styles.mobileTextWrapper}>
                  <h4>Entrega Rápida</h4>
                  <p>Logística eficiente para garantir os prazos do seu projeto.</p>
                </div>
              </div>
              <div className={styles.mobileTechItem}>
                <div className={styles.mobileIconWrapper}>
                  <Wrench size={18} />
                </div>
                <div className={styles.mobileTextWrapper}>
                  <h4>Montagem Especializada</h4>
                  <p>Equipas certificadas para uma instalação de excelência.</p>
                </div>
              </div>
              <div className={styles.mobileTechItem}>
                <div className={styles.mobileIconWrapper}>
                  <Headset size={18} />
                </div>
                <div className={styles.mobileTextWrapper}>
                  <h4>Apoio Pós-Venda</h4>
                  <p>Acompanhamento contínuo e garantia de satisfação total.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
