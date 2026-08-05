"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, HelpCircle, FileText, ArrowRight } from "lucide-react";
import styles from "./GlassConfigurator.module.css";

export default function GlassConfigurator() {
  // Option selection states
  const [thermal, setThermal] = useState("high"); // medium, high, max
  const [solar, setSolar] = useState("none"); // none, medium, high
  const [safety, setSafety] = useState("people"); // normal, people, intrusion
  const [acoustic, setAcoustic] = useState("normal"); // normal, high, extreme

  // Recommendations calculation matrix based on parameters
  const recommendation = useMemo(() => {
    let rec = {
      title: "Vidro Duplo Termo-Acústico de Segurança",
      tag: "Configuração Standard Recomendada",
      desc: "Adequado para residências modernas de alta exigência e edifícios de escritórios. Combina poupança de climatização substancial com protecção eficaz contra quebras acidentais.",
      panes: [
        { name: "Vidro Baixo Emissivo", thickness: "6 mm", color: "rgba(6, 182, 212, 0.25)" },
        { name: "Câmara de Argon", thickness: "16 mm", isSpacer: true },
        { name: "Vidro Laminado de Segurança", thickness: "33.1 (6.38 mm)", color: "rgba(13, 148, 136, 0.2)" }
      ],
      metrics: {
        ug: "1.1 W/(m²K)",
        g: "44%",
        tl: "72%",
        rw: "37 (-1;-4) dB"
      }
    };

    if (thermal === "max" || solar === "high") {
      rec = {
        title: "Vidro Duplo Super Isolante com Controlo Solar",
        tag: "Máxima Eficiência Energética",
        desc: "Ideal para grandes fachadas cortina e vãos expostos a forte insolação. Limita a entrada de calor solar no Verão enquanto minimiza perdas térmicas no Inverno.",
        panes: [
          { name: "Vidro Controlo Solar", thickness: "6 mm", color: "rgba(6, 182, 212, 0.4)" },
          { name: "Câmara de Argon", thickness: "16 mm", isSpacer: true },
          { name: "Vidro Duplo Laminado Low-E", thickness: "44.2 (8.76 mm)", color: "rgba(6, 182, 212, 0.15)" }
        ],
        metrics: {
          ug: "1.0 W/(m²K)",
          g: "26%",
          tl: "52%",
          rw: "39 (-2;-6) dB"
        }
      };
    } else if (acoustic === "extreme" || safety === "intrusion") {
      rec = {
        title: "Vidro Laminado Duplo de Alta Segurança & Acústico",
        tag: "Máxima Proteção & Insonorização",
        desc: "Desenvolvido para ambientes ruidosos ou que requeiram barreira anti-intrusão activa. Garante classificação anti-agressão física certificada EN 356.",
        panes: [
          { name: "Vidro Temperado Acústico", thickness: "8 mm", color: "rgba(13, 148, 136, 0.3)" },
          { name: "Câmara de Argon", thickness: "16 mm", isSpacer: true },
          { name: "Laminado de Alta Segurança", thickness: "44.4 Acústico (8.76 mm)", color: "rgba(6, 182, 212, 0.3)" }
        ],
        metrics: {
          ug: "1.1 W/(m²K)",
          g: "42%",
          tl: "68%",
          rw: "45 (-1;-3) dB"
        }
      };
    } else if (thermal === "medium" && solar === "none" && safety === "normal" && acoustic === "normal") {
      rec = {
        title: "Vidro Duplo Termo-Acústico Básico",
        tag: "Configuração Essencial",
        desc: "Configuração equilibrada para isolamento térmico standard e controle térmico básico de custo controlado.",
        panes: [
          { name: "Vidro Flutuante Claro", thickness: "4 mm", color: "rgba(255, 255, 255, 0.1)" },
          { name: "Câmara de Ar", thickness: "16 mm", isSpacer: true },
          { name: "Vidro Termoclaro", thickness: "4 mm", color: "rgba(255, 255, 255, 0.15)" }
        ],
        metrics: {
          ug: "1.4 W/(m²K)",
          g: "62%",
          tl: "80%",
          rw: "32 (-1;-3) dB"
        }
      };
    }

    return rec;
  }, [thermal, solar, safety, acoustic]);

  return (
    <section id="configurador" className={styles.configSection}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <span className={styles.subtitle}>Especificador Técnico</span>
          <h2 className={styles.mainTitle}>
            Configure a Sua Solução de <strong>Vidro Técnico</strong>
          </h2>
        </div>

        {/* Dynamic Calculator Widget Grid */}
        <div className={styles.widgetGrid}>

          {/* Left panel selectors */}
          <div className={styles.controlPanel}>

            {/* Thermal Insulation Group */}
            <div className={styles.controlGroup}>
              <div className={styles.groupLabel}>Isolamento Térmico (Aquecimento)</div>
              <div className={styles.optionsRow}>
                <button
                  className={`${styles.optionBtn} ${thermal === "medium" ? styles.optionActive : ""}`}
                  onClick={() => setThermal("medium")}
                >
                  Standard (Ug ~1.4)
                </button>
                <button
                  className={`${styles.optionBtn} ${thermal === "high" ? styles.optionActive : ""}`}
                  onClick={() => setThermal("high")}
                >
                  Elevado (Ug ~1.1)
                </button>
                <button
                  className={`${styles.optionBtn} ${thermal === "max" ? styles.optionActive : ""}`}
                  onClick={() => setThermal("max")}
                >
                  Máximo (Ug ~1.0)
                </button>
              </div>
            </div>

            {/* Solar Control Group */}
            <div className={styles.controlGroup}>
              <div className={styles.groupLabel}>Controlo Solar (Calor Estival)</div>
              <div className={styles.optionsRow}>
                <button
                  className={`${styles.optionBtn} ${solar === "none" ? styles.optionActive : ""}`}
                  onClick={() => setSolar("none")}
                >
                  Não Necessário
                </button>
                <button
                  className={`${styles.optionBtn} ${solar === "medium" ? styles.optionActive : ""}`}
                  onClick={() => setSolar("medium")}
                >
                  Médio (Fator g 40%)
                </button>
                <button
                  className={`${styles.optionBtn} ${solar === "high" ? styles.optionActive : ""}`}
                  onClick={() => setSolar("high")}
                >
                  Elevado (Fator g 25%)
                </button>
              </div>
            </div>

            {/* Physical Safety Group */}
            <div className={styles.controlGroup}>
              <div className={styles.groupLabel}>Segurança Física (Impacto/Intrusão)</div>
              <div className={styles.optionsRow}>
                <button
                  className={`${styles.optionBtn} ${safety === "normal" ? styles.optionActive : ""}`}
                  onClick={() => setSafety("normal")}
                >
                  Básica
                </button>
                <button
                  className={`${styles.optionBtn} ${safety === "people" ? styles.optionActive : ""}`}
                  onClick={() => setSafety("people")}
                >
                  Proteção Pessoas
                </button>
                <button
                  className={`${styles.optionBtn} ${safety === "intrusion" ? styles.optionActive : ""}`}
                  onClick={() => setSafety("intrusion")}
                >
                  Anti-Intrusão (EN 356)
                </button>
              </div>
            </div>

            {/* Acoustic Isolation Group */}
            <div className={styles.controlGroup}>
              <div className={styles.groupLabel}>Isolamento Acústico (Ruído)</div>
              <div className={styles.optionsRow}>
                <button
                  className={`${styles.optionBtn} ${acoustic === "normal" ? styles.optionActive : ""}`}
                  onClick={() => setAcoustic("normal")}
                >
                  Padrão (Rw ~32dB)
                </button>
                <button
                  className={`${styles.optionBtn} ${acoustic === "high" ? styles.optionActive : ""}`}
                  onClick={() => setAcoustic("high")}
                >
                  Elevado (Rw ~37dB)
                </button>
                <button
                  className={`${styles.optionBtn} ${acoustic === "extreme" ? styles.optionActive : ""}`}
                  onClick={() => setAcoustic("extreme")}
                >
                  Extremo (Rw &gt;42dB)
                </button>
              </div>
            </div>

          </div>

          {/* Right panel result card */}
          <AnimatePresence mode="wait">
            {recommendation && (
              <motion.div
                className={`glass-card ${styles.resultCard}`}
                key={recommendation.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.resultHeader}>
                  <span className={styles.recLabel}>{recommendation.tag}</span>
                  <h3 className={styles.recTitle}>{recommendation.title}</h3>
                </div>

                {/* 3D-like structural blueprint mockup diagram */}
                <div className={styles.glassStackVisual}>
                  {recommendation.panes.map((pane, idx) => {
                    if (pane.isSpacer) {
                      return (
                        <div
                          key={idx}
                          className={styles.spacerBar}
                          style={{ width: "40px" }}
                        >
                          <span className={styles.argonLabel}>ARGON</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className={styles.pane}
                        style={{
                          width: pane.thickness.includes("33.1") || pane.thickness.includes("44.2") || pane.thickness.includes("44.4") ? "24px" : "14px",
                          backgroundColor: pane.color,
                          border: "1.5px solid rgba(255,255,255,0.4)"
                        }}
                      >
                        <span className={styles.paneLabel}>
                          {pane.thickness}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Performance indicators metrics display */}
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricVal}>{recommendation.metrics.ug}</span>
                    <span className={styles.metricLabel}>Coef. Ug</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricVal}>{recommendation.metrics.g}</span>
                    <span className={styles.metricLabel}>Fator Solar (g)</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricVal}>{recommendation.metrics.tl}</span>
                    <span className={styles.metricLabel}>Transm. Luz</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricVal}>{recommendation.metrics.rw}</span>
                    <span className={styles.metricLabel}>Atenuação Rw</span>
                  </div>
                </div>

                <p className={styles.recDescription}>
                  {recommendation.desc}
                </p>

                <button className={styles.quoteBtn}>
                  <span>Pedir Ficha Técnica / Orçamento</span>
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
