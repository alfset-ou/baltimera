'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useUI } from '@/lib/ui';
import { GALLERY_MORE, GALLERY_ORDER, GALLERY_SIZES, GALLERY_VISIBLE, PHOTOS, PROJECT_LABELS, photoSrc } from '@/lib/photos';

function Project({ id }: { id: number }) {
  const { openPhoto } = useUI();
  const photo = PHOTOS[id];

  return (
    <figure className="project scroll-reveal">
      <button
        className="project-image"
        data-photo={id}
        aria-label={`Увеличить фото: ${photo.alt}`}
        onClick={() => openPhoto(id)}
      >
        <Image
          src={photoSrc(id)}
          width={photo.width}
          height={photo.height}
          sizes={GALLERY_SIZES}
          alt={photo.alt}
          decoding="async"
        />
        <span className="photo-open" aria-hidden="true">
          +
        </span>
      </button>
      <figcaption>{PROJECT_LABELS[id]}</figcaption>
    </figure>
  );
}

export function Works() {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    moreRef.current?.querySelector('button')?.focus();
  }, [moreOpen]);

  const showMore = useCallback(() => setMoreOpen(true), []);

  return (
    <section className="section" id="works" aria-labelledby="works-title">
      <div className="section-heading scroll-reveal">
        <span className="eyebrow">Наши работы</span>
        <h2 id="works-title">
          Фасадные панели
          <span className="works-heading-tail">{' в\u00a0проектах'}</span>
        </h2>
        <p>Фасады, входные зоны и детали отделки. Нажмите на фото, чтобы рассмотреть материал ближе.</p>
      </div>
      <div className="gallery">
        {GALLERY_VISIBLE.map((id) => (
          <Project key={id} id={id} />
        ))}
      </div>
      <div className="gallery more-gallery" ref={moreRef} hidden={!moreOpen}>
        {GALLERY_MORE.map((id) => (
          <Project key={id} id={id} />
        ))}
      </div>
      <div className="gallery-bottom scroll-reveal">
        <button className="button secondary" id="load-more" onClick={showMore} hidden={moreOpen}>
          Показать ещё фотографии
        </button>
        <span id="gallery-count">{moreOpen ? `${GALLERY_ORDER.length} из ${GALLERY_ORDER.length}` : `${GALLERY_VISIBLE.length} из ${GALLERY_ORDER.length}`}</span>
      </div>
    </section>
  );
}
