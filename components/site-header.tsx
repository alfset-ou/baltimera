'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Brand } from '@/components/brand';
import { closeDialog, openDialog } from '@/lib/dialog';
import { NAV_LINKS } from '@/lib/nav';
import { useUI } from '@/lib/ui';

export function SiteHeader() {
  const { openInfo } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id],footer[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection((entry.target as HTMLElement).id);
        });
      },
      { rootMargin: '-15% 0px -60% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const openMenu = useCallback(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    openDialog(dialog);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (menuRef.current) closeDialog(menuRef.current);
  }, []);

  const current = (section: string) => (activeSection === section ? 'location' : undefined);

  return (
    <>
      <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Основная навигация">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={current(link.section)}
                onClick={() => setActiveSection(link.section)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <div className="languages" aria-label="Выбор языка">
              <button data-language="ET" onClick={() => openInfo('et')}>
                ET
              </button>
              <span aria-current="true">RU</span>
              <button data-language="EN" onClick={() => openInfo('en')}>
                EN
              </button>
            </div>
            <a className="button" href="#request">
              Оставить заявку
            </a>
            <button
              className="menu-toggle"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={openMenu}
            >
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <dialog
        className="mobile-menu"
        id="mobile-menu"
        ref={menuRef}
        onClose={() => setMenuOpen(false)}
      >
        <div className="menu-top">
          <Brand />
          <button className="close-menu" aria-label="Закрыть меню" onClick={closeMenu}>
            ×
          </button>
        </div>
        <nav aria-label="Мобильная навигация">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={current(link.section)}
              onClick={() => {
                setActiveSection(link.section);
                closeMenu();
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a className="button" href="#request" onClick={closeMenu}>
          Оставить заявку
        </a>
      </dialog>
    </>
  );
}
