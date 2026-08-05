"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, motion } from "framer-motion";
import styles from "./Stats.module.css";

// Dynamic count-up counter component triggered on visibility
function Counter({ value, duration = 1.5 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    const endValue = parseInt(value, 10);
    const startValue = 0;

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const currentCount = Math.floor(progress * (endValue - startValue) + startValue);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function Stats() {
  const statsData = [
    {
      value: "25",
      suffix: "+",
      label: "Anos de Experiência",
      sublabel: "No sector de transformação de vidro",
      accent: true,
    },
    {
      value: "12000",
      suffix: " m²",
      label: "Capacidade Industrial",
      sublabel: "Instalações modernas em Mortágua",
      accent: false,
    },
    {
      value: "100",
      suffix: "%",
      label: "Qualidade Certificada",
      sublabel: "Normas EN e marcação CE",
      accent: false,
    },
    {
      value: "1500",
      suffix: "+",
      label: "Projetos Fornecidos",
      sublabel: "Fachadas, interiores e obras públicas",
      accent: true,
    },
  ];

  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.grid}>
          {statsData.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statItem}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={styles.numberContainer}>
                <span className={stat.accent ? styles.accentNum : ""}>
                  <Counter value={stat.value} />
                </span>
                <span className={styles.suffix}>{stat.suffix}</span>
              </div>
              <div className={styles.label}>{stat.label}</div>
              <div className={styles.sublabel}>{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
