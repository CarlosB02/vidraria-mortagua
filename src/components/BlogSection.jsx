"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import styles from "./BlogSection.module.css";

export default function BlogSection() {
  const posts = [
    {
      title: "Especificação de Vidro de Segurança: PVB vs SentryGlas",
      desc: "Análise comparativa das características mecânicas e de deformação pós-rotura em intercalares estruturais para guardas e coberturas.",
      category: "Técnica & Engenharia",
      date: "28 Julho 2026",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop",
    },
    {
      title: "Eficiência Térmica em Fachadas de Vidro Duplo",
      desc: "Como a combinação de revestimentos baixo emissivos e o enchimento com gás Argon otimizam a poupança energética na arquitetura contemporânea.",
      category: "Sustentabilidade",
      date: "15 Julho 2026",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop",
    },
    {
      title: "Vidro com Impressão Digital Cerâmica na Arquitetura",
      desc: "Tendências de personalização e controlo térmico ativo de fachadas através da vitrificação de padrões gráficos personalizados.",
      category: "Arquitetura & Design",
      date: "02 Julho 2026",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop",
    },
  ];

  return (
    <section id="blog" className={styles.section}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <div className={styles.titleArea}>
            <span className={styles.subtitle}>Conhecimento & Insights</span>
            <h2 className={styles.mainTitle}>
              Industrial <strong>Blog</strong>
            </h2>
          </div>
          <p className={styles.description}>
            Acompanhe novidades, artigos técnicos e tendências da indústria do vidro, com a experiência e conhecimento da Vidraria Mortágua.
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className={styles.grid}>
          {posts.map((post, idx) => (
            <motion.div
              key={post.title}
              className={styles.card}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
            >
              <div className={styles.imageArea}>
                <div
                  className={styles.image}
                  style={{ backgroundImage: `url(${post.image})` }}
                />
              </div>
              <div className={styles.infoArea}>
                <div className={styles.metaRow}>
                  <span className={styles.category}>{post.category}</span>
                  <span className={styles.date}>{post.date}</span>
                </div>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardDesc}>{post.desc}</p>
                <div className={styles.readMore}>
                  <span>Ler Artigo</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
