"use client";

import { motion } from "framer-motion";
import { Truck, Wrench, Headphones } from "lucide-react";
import styles from "./FactoryTechnology.module.css";

export default function FactoryTechnology() {
  const cards = [
    {
      title: "Entrega",
      desc: "Garantimos o transporte seguro e pontual dos seus vidros até ao local de obra, com viaturas e equipas especializadas.",
      icon: <Truck size={32} />,
    },
    {
      title: "Montagem",
      desc: "Instalação profissional executada por equipas técnicas experientes, assegurando precisão e cumprimento de todas as normas.",
      icon: <Wrench size={32} />,
    },
    {
      title: "Pós-Venda",
      desc: "Acompanhamento contínuo e assistência técnica após a instalação, para a sua total tranquilidade e satisfação.",
      icon: <Headphones size={32} />,
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="jornada" className={styles.techSection}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <span className={styles.subtitle}>A nossa jornada consigo</span>
          <h2 className={styles.mainTitle}>
            Consigo do <strong>início ao fim</strong>
          </h2>
        </div>

        {/* Cards Grid */}
        <motion.div 
          className={styles.cardsGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {cards.map((card, idx) => (
            <motion.div key={idx} className={styles.card} variants={itemVariants}>
              <div className={styles.cardIconWrapper}>
                {card.icon}
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
