"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import clsx from "clsx";
import styles from "./Header.module.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState("PT");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "#inicio" },
    { name: "Produtos", href: "#produtos" },
    { name: "Projetos", href: "#projetos" },
    { name: "Notícias", href: "#noticias" },
    { name: "Documentação", href: "#documentacao" },
    { name: "Contactos", href: "#contactos" },
  ];

  return (
    <header className={clsx(styles.header, isScrolled && styles.scrolled)}>
      <div className={clsx("container", styles.navContainer)}>
        {/* Brand Logo */}
        <a href="#inicio" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
          <img src="/logo.png" alt="Vidraria Mortágua" style={{ height: '40px', width: 'auto' }} />
        </a>

        {/* Desktop Navigation Links */}
        <nav className={styles.navMenu}>
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className={styles.navLink}>
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Section (Lang Toggle & CTA) */}
        <div className={styles.rightContainer}>
          <div className={styles.langDropdownContainer}>
            <button className={styles.langDropdownBtn}>
              <img src={`/flags/${lang.toLowerCase()}.png`} alt={lang} className={styles.flagIcon} onError={(e) => e.target.style.display = 'none'} />
              <ChevronDown size={16} />
            </button>
            <div className={styles.langDropdownMenu}>
              {["PT", "ENG", "ES"].map((l) => (
                <button 
                  key={l}
                  className={clsx(styles.langDropdownItem, lang === l && styles.langActive)}
                  onClick={() => setLang(l)}
                >
                  <img src={`/flags/${l.toLowerCase()}.png`} alt={l} className={styles.flagIcon} onError={(e) => e.target.style.display = 'none'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={clsx(styles.mobileMenu, isMobileMenuOpen && styles.mobileMenuOpen)}>
        {navLinks.map((link) => (
          <a 
            key={link.name} 
            href={link.href} 
            className={styles.mobileMenuLink}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.name}
          </a>
        ))}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
          {["PT", "ENG", "ES"].map((l, idx) => (
            <div key={l} style={{ display: 'flex', gap: '1rem' }}>
              <span 
                className={clsx(styles.langBtn, lang === l && styles.langActive)}
                onClick={() => setLang(l)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <img src={`/flags/${l.toLowerCase()}.png`} alt={l} className={styles.flagIcon} onError={(e) => e.target.style.display = 'none'} />
              </span>
              {idx < 2 && (
                <span style={{ color: 'rgba(0,0,0,0.1)' }}>|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
