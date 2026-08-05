"use client";

import { motion } from "framer-motion";
import styles from "./Products.module.css";

export default function Products() {
  const products = [
    {
      title: "Vidro Temperado",
      desc: "Vidro de segurança com elevada resistência mecânica e térmica para aplicações exigentes.",
      specs: ["EN 12150", "Resistência Choque", "Mobiliário & Portas"],
      image: "/_DSC0008.webp",
    },
    {
      title: "Vidros Laminados",
      desc: "Solução de segurança composta por múltiplas chapas de vidro unidas por películas de PVB.",
      specs: ["EN 14449", "Segurança Anti-roubo", "Guardas & Coberturas"],
      image: "/_DSC97391.webp",
    },
    {
      title: "Vidro Duplo/Triplo",
      desc: "Elevado isolamento térmico e acústico para maior conforto e eficiência energética.",
      specs: ["Baixo Emissivo", "Gás Argon", "Eficiência Energética"],
      image: "/_DSC9969.webp",
    },
    {
      title: "Pintura Digital/Serigrafia",
      desc: "Personalização de vidro com acabamentos de elevada durabilidade para projetos únicos.",
      specs: ["Design Customizado", "Tintas Cerâmicas", "Fachadas & Interiores"],
      image: "/novembro.webp",
    },
  ];

  return (
    <section id="produtos" className={styles.productsSection}>
      {/* Topographic Background */}
      <div className={styles.topographicBg}>
        <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          {/* Top-Right Concentric Waves */}
          <path d="M1440,100 C1300,120 1200,60 1150,-50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M1440,220 C1250,250 1100,150 1050,-50" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1440,340 C1200,380 1000,240 950,-50" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <path d="M1440,460 C1150,510 900,330 850,-50" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1440,580 C1100,640 800,420 750,-50" stroke="currentColor" strokeWidth="1" />
          <path d="M1440,700 C1050,770 700,510 650,-50" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1440,820 C1000,900 600,600 550,-50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />

          {/* Bottom-Left Concentric Waves */}
          <path d="M-50,850 C100,820 180,900 200,1000" stroke="currentColor" strokeWidth="1.2" />
          <path d="M-50,720 C180,680 280,800 320,1000" stroke="currentColor" strokeWidth="1.5" />
          <path d="M-50,590 C260,540 380,700 440,1000" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <path d="M-50,460 C340,400 480,600 560,1000" stroke="currentColor" strokeWidth="1.2" />
          <path d="M-50,330 C420,260 580,500 680,1000" stroke="currentColor" strokeWidth="1" />
          <path d="M-50,200 C500,120 680,400 800,1000" stroke="currentColor" strokeWidth="1.5" />

          {/* Center Floating Ridge */}
          <path d="M300,300 Q500,150 700,250 T1100,200" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M250,380 Q500,230 750,330 T1150,280" stroke="currentColor" strokeWidth="1.2" />
          <path d="M200,460 Q500,310 800,410 T1200,360" stroke="currentColor" strokeWidth="1.5" />
          <path d="M150,540 Q500,390 850,490 T1250,440" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <path d="M100,620 Q500,470 900,570 T1300,520" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="radial-glow-secondary" />
      <div className="container" style={{ width: "100%" }}>
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <div className={styles.titleArea}>
            <span className={styles.subtitle}>Gama de Soluções</span>
            <h2 className={styles.mainTitle}>
              Vidro de Alta <strong>Performance</strong>
            </h2>
          </div>
          <p className={styles.description}>
            Desenvolvemos uma vasta gama de vidros processados industrialmente para corresponder aos mais exigentes requisitos técnicos e estéticos do seu projeto.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className={styles.gridContainer}>
          <div className={styles.cardsGrid}>
            {products.map((product, i) => (
              <motion.div
                key={product.title}
                className={styles.card}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              >
                <div className={styles.laserLine} />
                <div className={styles.cardBg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                </div>
                <div className={styles.overlay} />
                <div className={styles.content}>
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <p className={styles.productDesc}>{product.desc}</p>
                  <div className={styles.techSpecs}>
                    {product.specs.map((spec) => (
                      <span key={spec} className={styles.specBadge}>
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
