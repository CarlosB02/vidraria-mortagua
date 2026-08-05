"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import styles from "./Applications.module.css";

export default function Applications() {
  const projects = [
    {
      title: "Edifício Exporlux",
      category: "Sede Corporativa / Iluminação e Vidro",
      detail: "Isolamento Térmico de Alta Performance.",
      image: "/exporlux.webp",
    },
    {
      title: "Arquitetura Exterior",
      category: "Soluções Estruturais",
      detail: "Proteção e Estética de Alta Resistência.",
      image: "/exterior.webp",
    },
    {
      title: "Design de Interiores",
      category: "Elegância e Funcionalidade",
      detail: "Transparência e Luminosidade à Medida.",
      image: "/interiores.webp",
    },
  ];

  return (
    <section id="aplicacoes" className={styles.section}>
      {/* Background Grid and Red Glows */}
      <div className={styles.gridBg} />
      <div className={styles.redGlow1} />
      <div className={styles.redGlow2} />

      <div className="container" style={{ width: "100%" }}>
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <div className={styles.titleArea}>
            <span className={styles.subtitle}>Portefólio de Obras</span>
            <h2 className={styles.mainTitle}>
              Aplicações em <strong>Arquitetura Moderna</strong>
            </h2>
          </div>
          <a href="#portfolio" className={styles.viewAllLink}>
            Ver portfólio completo <ArrowRight size={18} />
          </a>
        </div>

        {/* CSS Grid Portfolio */}
        <div className={styles.portfolioGrid}>
          {projects.map((project, idx) => (
            <motion.div
              key={project.title}
              className={`${styles.card} ${styles[`card${idx}`]}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
            >
              <div
                className={styles.cardBg}
                style={{ backgroundImage: `url(${project.image})` }}
              />
              <div className={styles.overlay} />
              <div className={styles.content}>
                <div className={styles.info}>
                  <span className={styles.cardCategory}>{project.category}</span>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                </div>
                <div className={styles.techDetail}>{project.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
