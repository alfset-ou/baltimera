export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy scroll-reveal">
          <span className="eyebrow">Производство и продажа</span>
          <h1 id="hero-title">
            Современные
            <br />
            фасадные панели
          </h1>
          <p>
            Для отделки домов и входных зон.
            <br />
            Закажите панели отдельно или с монтажом.
          </p>
          <div className="hero-actions">
            <a className="button" href="#request">
              Получить предложение
            </a>
            <a className="button secondary" href="#works">
              Смотреть работы
            </a>
          </div>
        </div>
        <div className="hero-photo">
          {/* Art direction: the phone gets its own sky, so this stays a <picture>. */}
          <picture className="hero-picture">
            <source
              media="(max-width:700px)"
              srcSet="/images/hero-mobile-sky-v27-small.webp 700w, /images/hero-mobile-sky-v27.webp 1037w"
              sizes="100vw"
            />
            <img
              src="/images/hero-house-v3.webp"
              srcSet="/images/hero-house-v3-small.webp 1000w, /images/hero-house-v3.webp 1672w"
              sizes="100vw"
              width={1672}
              height={941}
              alt="Визуализация современного дома с вертикальными фасадными панелями на фоне неба"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </picture>
          <div className="hero-facts scroll-reveal">
            <div>
              <span className="fact-mark" aria-hidden="true">
                01
              </span>
              <span>Производство</span>
            </div>
            <div>
              <span className="fact-mark" aria-hidden="true">
                02
              </span>
              <span>Продажа</span>
            </div>
            <div>
              <span className="fact-mark" aria-hidden="true">
                03
              </span>
              <span>Монтаж по желанию</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
