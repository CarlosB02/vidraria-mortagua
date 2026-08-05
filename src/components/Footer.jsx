import { Phone, Mail, MapPin, Shield } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: "Vidro Temperado", href: "#produtos" },
    { name: "Vidro Laminado", href: "#produtos" },
    { name: "Vidro Duplo", href: "#produtos" },
    { name: "Controlo Solar", href: "#produtos" },
    { name: "Impressão Digital", href: "#produtos" },
  ];

  const companyLinks = [
    { name: "Sobre Nós", href: "#inicio" },
    { name: "Tecnologia", href: "#tecnologia" },
    { name: "Configurador Técnico", href: "#configurador" },
    { name: "Aplicações", href: "#aplicacoes" },
    { name: "Contactos", href: "#contactos" },
  ];

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Brand Description Column */}
          <div className={styles.brandCol}>
            <div className={styles.brandLogo}>
              <img src="/logo.png" alt="Vidraria Mortágua" style={{ height: '40px', width: 'auto' }} />
            </div>
            <p className={styles.brandDesc}>
              Transformação industrial avançada de vidro plano para arquitetura, construção e engenharia civil. Garantimos precisão, resistência e performance térmica.
            </p>
            <div className={styles.certBadges}>
              <div className={styles.certBadge}>CE EN 12150</div>
              <div className={styles.certBadge}>CE EN 14449</div>
              <div className={styles.certBadge}>ISO 9001</div>
            </div>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialIcon} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" className={styles.socialIcon} aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#blog" className={styles.socialIcon} aria-label="Blog">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
              </a>
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className={styles.colTitle}>Soluções</h4>
            <ul className={styles.linkList}>
              {productLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className={styles.footerLink}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className={styles.colTitle}>Empresa</h4>
            <ul className={styles.linkList}>
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className={styles.footerLink}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts Column */}
          <div>
            <h4 className={styles.colTitle}>Contacto Industrial</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <MapPin size={18} />
                <span>
                  Zona Industrial de Mortágua, Lote 14<br />
                  3450-153 Mortágua, Portugal
                </span>
              </li>
              <li className={styles.contactItem}>
                <Phone size={18} />
                <a href="tel:+351231920000" className={styles.footerLink}>
                  +351 231 920 000
                </a>
              </li>
              <li className={styles.contactItem}>
                <Mail size={18} />
                <a href="mailto:geral@vidrariamortagua.pt" className={styles.footerLink}>
                  geral@vidrariamortagua.pt
                </a>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>© {currentYear} Vidraria Mortágua, Lda. Todos os direitos reservados.</p>
          <div className={styles.legalLinks}>
            <a href="#">Condições Gerais de Venda</a>
            <a href="#">Política da Qualidade</a>
            <a href="#">Livro de reclamações online</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
