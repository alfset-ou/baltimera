import Image from 'next/image';

export function About() {
  return (
    <section className="section about-editorial" id="about" aria-labelledby="about-title">
      <div className="about-intro">
        <div className="section-heading scroll-reveal">
          <span className="eyebrow">О компании</span>
          <h2 id="about-title">
            Фасадные панели
            <br />
            от Baltimera
          </h2>
        </div>
        <div className="about-copy scroll-reveal">
          <p>
            Производим и продаём фасадные панели для частных домов и строительных проектов. Работаем
            с владельцами домов, строителями, архитекторами и дизайнерами.
          </p>
          <p>Выберите поставку панелей или закажите материал с монтажом.</p>
          <a className="button secondary" href="#request">
            Обсудить проект
          </a>
        </div>
      </div>
      <figure className="about-photo-wide scroll-reveal">
        <Image
          src="/images/about-facade-v31.webp"
          width={2172}
          height={724}
          sizes="(max-width:1368px) 92vw, 1240px"
          alt="Архитектурная визуализация террасы с фасадными панелями: натуральные деревянные ламели на чёрном основании"
          decoding="async"
        />
      </figure>
    </section>
  );
}
