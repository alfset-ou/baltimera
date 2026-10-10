import { Brand } from '@/components/brand';
import { InfoButton } from '@/components/info-button';
import { NAV_LINKS } from '@/lib/nav';

export function SiteFooter() {
  return (
    <footer className="footer section" id="contacts" aria-labelledby="footer-title">
      <div className="footer-grid scroll-reveal">
        <div>
          <Brand />
          <p className="footer-description">
            Производство и продажа
            <br />
            фасадных панелей.
          </p>
        </div>
        <div className="footer-contacts">
          <h4 id="footer-title">Контакты</h4>
          <div>
            <span>Телефон</span>
            <p>
              <a href="tel:+37255556781">+372 5555 6781</a>
            </p>
          </div>
          <div>
            <span>E-mail</span>
            <p>
              <a href="mailto:baltimera.eu@gmail.com">baltimera.eu@gmail.com</a>
            </p>
          </div>
        </div>
        <nav aria-label="Навигация в подвале">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="footer-bottom scroll-reveal">
        <span>© 2026 Baltimera</span>
        <InfoButton kind="privacy">Политика конфиденциальности</InfoButton>
      </div>
    </footer>
  );
}
