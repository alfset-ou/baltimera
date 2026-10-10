import Image from 'next/image';

const STEPS = [
  {
    title: 'Термообработка сосны',
    copy: 'Северную сосну обрабатывают высокой температурой и паром. Древесина становится стабильнее и устойчивее к влаге.',
    icon: (
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M13 19.5V7a3 3 0 0 1 6 0v12.5a6 6 0 1 1-6 0Z" />
        <path d="M16 12v11m0 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm7-14h4m-4 5h3" />
      </svg>
    ),
  },
  {
    title: 'Структурирование поверхности',
    copy: 'Каждую рейку обрабатывают отдельно, раскрывая природный рельеф древесины и подчёркивая годичные кольца.',
    icon: (
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M5 5h22v22H5zM10 5c4 5-3 9 0 14s2 5 1 8M16 5c-4 6 4 9 0 14s0 5 0 8M23 5c-3 5 1 8-1 12s-2 7 1 10" />
      </svg>
    ),
  },
  {
    title: 'Защитное покрытие',
    copy: 'Дерево получает защитно-декоративное покрытие. Для основания используют оцинкованную сталь с матовым покрытием Granite® Ultramat.',
    icon: (
      <svg viewBox="0 0 32 32" fill="none">
        <path d="m16 4 10 4v8c0 6-6 10-10 12C12 26 6 22 6 16V8l10-4Z" />
        <path d="m11 16 3.5 3.5L22 12" />
      </svg>
    ),
  },
];

export function Manufacturing() {
  return (
    <section
      className="section manufacturing-section"
      id="manufacturing"
      aria-labelledby="manufacturing-title"
    >
      <div className="section-heading scroll-reveal">
        <span className="eyebrow">Материалы и обработка</span>
        <h2 id="manufacturing-title">Как создаётся фасадная панель</h2>
      </div>
      <div className="manufacturing-layout">
        <figure className="manufacturing-photo scroll-reveal">
          <Image
            src="/images/panel-wood-v19.webp"
            width={1000}
            height={1000}
            sizes="(max-width:700px) 100vw, (max-width:1100px) 45vw, 620px"
            alt="Крупный план структурированной термососны: выразительные годичные кольца и рельеф волокон на матовом чёрном основании"
            decoding="async"
          />
        </figure>
        <ol className="manufacturing-steps">
          {STEPS.map((step) => (
            <li key={step.title} className="scroll-reveal">
              <details open>
                <summary>
                  <span className="manufacturing-icon" aria-hidden="true">
                    {step.icon}
                  </span>
                  <h3>{step.title}</h3>
                  <span className="step-toggle" aria-hidden="true"></span>
                </summary>
                <p>{step.copy}</p>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
