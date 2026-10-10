'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

import { closeDialog, isBackdropClick, openDialog } from '@/lib/dialog';
import { GALLERY_ORDER, PHOTO_DESCRIPTIONS, photoSrc } from '@/lib/photos';

export type InfoKind = 'privacy' | 'cookies' | 'et' | 'en';

const INFO: Record<InfoKind, { title: string; copy: string }> = {
  privacy: {
    title: 'Политика конфиденциальности',
    copy: '[ТЕКСТ ПОЛИТИКИ ОТ КЛИЕНТА]. В этом прототипе данные формы не сохраняются и никуда не отправляются. Перед запуском необходимо добавить реквизиты оператора и утверждённый текст политики.',
  },
  cookies: {
    title: 'Cookies',
    copy: 'В прототипе нет аналитики и рекламных cookies. Выбор палитры хранится только в пределах текущей сессии браузера. Настройки согласия нужно добавить при подключении аналитики.',
  },
  et: {
    title: 'Эстонская версия',
    copy: 'Место для языка предусмотрено в дизайне. Утверждённый перевод не приложен; по Design guides.md тексты для ET и EN должны быть предоставлены или согласованы клиентом. Сейчас доступен русский прототип.',
  },
  en: {
    title: 'Английская версия',
    copy: 'Место для языка предусмотрено в дизайне. Утверждённый перевод не приложен; по Design guides.md тексты для ET и EN должны быть предоставлены или согласованы клиентом. Сейчас доступен русский прототип.',
  },
};

type UIContextValue = {
  openInfo: (kind: InfoKind) => void;
  openPhoto: (id: number) => void;
  closeInfo: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const value = useContext(UIContext);
  if (!value) throw new Error('useUI must be called inside UIProvider');
  return value;
}

function syncBodyScrollLock(): void {
  if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState({ title: '', copy: '' });
  const [counter, setCounter] = useState<number | null>(null);

  const infoRef = useRef<HTMLDialogElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);

  const closeInfo = useCallback(() => {
    if (infoRef.current) closeDialog(infoRef.current);
  }, []);

  const closeLightbox = useCallback(() => {
    if (lightboxRef.current) closeDialog(lightboxRef.current);
  }, []);

  const openInfo = useCallback((kind: InfoKind) => {
    setInfo(INFO[kind]);
    if (infoRef.current) openDialog(infoRef.current);
  }, []);

  const openPhoto = useCallback((id: number) => {
    setCounter(GALLERY_ORDER.indexOf(id));
    if (lightboxRef.current) openDialog(lightboxRef.current);
  }, []);

  const step = useCallback((by: number) => {
    setCounter((previous) =>
      previous === null ? 0 : (previous + by + GALLERY_ORDER.length) % GALLERY_ORDER.length,
    );
  }, []);

  const photoId = counter === null ? null : GALLERY_ORDER[counter];

  const onLightboxKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    },
    [step],
  );

  const onLightboxClick = useCallback((event: ReactMouseEvent<HTMLDialogElement>) => {
    const dialog = lightboxRef.current;
    if (!dialog) return;
    if (event.target === dialog || (event.target as HTMLElement).classList.contains('lightbox-content')) {
      closeDialog(dialog);
    }
  }, []);

  const onSwipeStart = useCallback((event: TouchEvent<HTMLImageElement>) => {
    swipeStart.current = event.changedTouches[0].clientX;
  }, []);

  const onSwipeEnd = useCallback(
    (event: TouchEvent<HTMLImageElement>) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (start === null) return;
      const delta = event.changedTouches[0].clientX - start;
      if (Math.abs(delta) > 50) step(delta > 0 ? -1 : 1);
    },
    [step],
  );

  const value = useMemo<UIContextValue>(
    () => ({ openInfo, openPhoto, closeInfo }),
    [closeInfo, openInfo, openPhoto],
  );

  return (
    <UIContext.Provider value={value}>
      {children}

      <dialog
        id="lightbox"
        className="lightbox"
        aria-label="Просмотр фотографий"
        ref={lightboxRef}
        onKeyDown={onLightboxKeyDown}
        onClick={onLightboxClick}
        onClose={syncBodyScrollLock}
      >
        <div className="lightbox-top">
          <span id="photo-counter">
            {counter === null ? '' : `${String(counter + 1).padStart(2, '0')} / ${GALLERY_ORDER.length}`}
          </span>
          <button id="lightbox-close" aria-label="Закрыть фото" onClick={closeLightbox}>
            ×
          </button>
        </div>
        <div className="lightbox-content">
          <button id="photo-prev" aria-label="Предыдущее фото" onClick={() => step(-1)}>
            ←
          </button>
          <img
            id="lightbox-image"
            src={photoId === null ? undefined : photoSrc(photoId)}
            alt={photoId === null ? '' : PHOTO_DESCRIPTIONS[photoId]}
            onTouchStart={onSwipeStart}
            onTouchEnd={onSwipeEnd}
          />
          <button id="photo-next" aria-label="Следующее фото" onClick={() => step(1)}>
            →
          </button>
        </div>
        <p id="photo-caption">{photoId === null ? '' : PHOTO_DESCRIPTIONS[photoId]}</p>
      </dialog>

      <dialog
        id="information"
        className="info-dialog"
        aria-labelledby="info-title"
        ref={infoRef}
        onClose={syncBodyScrollLock}
        onClick={(event) => {
          const dialog = infoRef.current;
          if (dialog && isBackdropClick(dialog, event)) closeDialog(dialog);
        }}
      >
        <button className="close-info" aria-label="Закрыть" onClick={closeInfo}>
          ×
        </button>
        <h2 id="info-title">{info.title}</h2>
        <p id="info-copy">{info.copy}</p>
        <button className="button close-info" onClick={closeInfo}>
          Понятно
        </button>
      </dialog>
    </UIContext.Provider>
  );
}
