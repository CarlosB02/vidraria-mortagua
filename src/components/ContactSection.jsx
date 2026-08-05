"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import styles from "./ContactSection.module.css";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "architecture",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API request submission
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        projectType: "architecture",
        message: "",
      });
    }, 800);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contactos" className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Left Side: Consultation Form */}
          <div className={styles.formPane}>
            <div className={styles.titleArea}>
              <span className={styles.subtitle}>Contacto Comercial</span>
              <h2 className={styles.mainTitle}>
                Solicitar <strong>Consulta Técnica</strong>
              </h2>
            </div>

            {isSubmitted ? (
              <div
                className="glass-card"
                style={{
                  padding: '3rem',
                  borderRadius: '6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  borderColor: 'var(--accent-cyan)'
                }}
              >
                <CheckCircle size={48} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem' }}>Mensagem Recebida</h3>
                <p style={{ color: 'rgba(248,250,252,0.7)', fontSize: '0.875rem', maxWidth: '400px' }}>
                  A nossa equipa de engenharia técnica irá analisar a sua solicitação e entrará em contacto num prazo de 24 horas úteis.
                </p>
                <button
                  className={styles.submitBtn}
                  onClick={() => setIsSubmitted(false)}
                  style={{ padding: '0.75rem 1.5rem', marginTop: '1rem' }}
                >
                  Enviar Nova Mensagem
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="name">Nome Completo</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className={styles.input}
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="email">E-mail</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className={styles.input}
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="company">Telemóvel</label>
                    <input
                      type="text"
                      id="Telemóvel"
                      name="Telemóvel"
                      required
                      className={styles.input}
                      value={formData.Telemóvel}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="projectType">Tipo de Projeto</label>
                    <select
                      id="projectType"
                      name="projectType"
                      className={styles.select}
                      value={formData.projectType}
                      onChange={handleChange}
                    >
                      <option value="architecture">Arquitetura / Engenharia</option>
                      <option value="construction">Construção Civil / Empreiteiro</option>
                      <option value="glazing">Instalador Vidreiro / Vidreira</option>
                      <option value="distribution">Distribuidor / Revendedor</option>
                      <option value="industrial">Parceiro Industrial Customizado</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="message">Especificações Técnicas / Mensagem</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className={styles.textarea}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Descreva as dimensões, quantidades, tipo de processamento (têmpera, laminação, vidro duplo) e requisitos do projeto..."
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  <span>Submeter Pedido</span>
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>

          {/* Right Side: Address & Industrial coordinates */}
          <div className={styles.infoPane}>
            <div className={styles.infoBlock}>
              <h4 className={styles.blockTitle}>Instalações</h4>
              <p className={styles.addressText}>
                <strong>Vidraria Mortágua, Lda.</strong><br />
                Zona Industrial de Mortágua, Lote 14<br />
                3450-153 Mortágua, Portugal
              </p>
            </div>

            <div className={styles.infoBlock}>
              <h4 className={styles.blockTitle}>Contactos Gerais</h4>
              <p className={styles.addressText}>
                Tlf: +351 231 920 000<br />
                E-mail: geral@vidrariamortagua.pt<br />
                Logística: expedicao@vidrariamortagua.pt
              </p>
            </div>

            <div className={styles.infoBlock}>
              <h4 className={styles.blockTitle}>Horário</h4>
              <div className={styles.workingHours}>
                <div className={styles.hourRow}>
                  <span>Segunda - Sexta (Produção)</span>
                  <span className={styles.hourVal}>08:00 - 17:00</span>
                </div>
                <div className={styles.hourRow}>
                  <span>Segunda - Sexta (Escritórios)</span>
                  <span className={styles.hourVal}>09:00 - 18:00</span>
                </div>
                <div className={styles.hourRow}>
                  <span>Sábado - Domingo</span>
                  <span className={styles.hourVal}>Encerrado</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
