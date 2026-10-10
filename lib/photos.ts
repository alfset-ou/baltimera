// Photo metadata taken from the designer's generator: intrinsic size for the markup
// and alt text for both the gallery image and the lightbox.

export type PhotoMeta = { alt: string; width: number; height: number };

export const PHOTOS: Record<number, PhotoMeta> = {
  1: { alt: 'Вертикальные фасадные панели рядом с окном', width: 1024, height: 1280 },
  2: { alt: 'Образец фасадной панели с вертикальными ламелями', width: 853, height: 1280 },
  3: { alt: 'Модульный дом с отделкой фасадными панелями', width: 1280, height: 1022 },
  4: { alt: 'Отделка панелями стены и потолка террасы', width: 961, height: 1280 },
  5: { alt: 'Компактное строение с комбинированным фасадом', width: 714, height: 1280 },
  6: { alt: 'Фактура и вертикальные ламели фасадной панели', width: 853, height: 1280 },
  7: { alt: 'Отделка панелями входной зоны под навесом', width: 851, height: 1280 },
  8: { alt: 'Образец фасадной панели на фоне стены', width: 853, height: 1280 },
  9: { alt: 'Дом с вертикальными фасадными панелями', width: 853, height: 1280 },
  10: { alt: 'Входная группа с вертикальными фасадными панелями', width: 1024, height: 1280 },
  11: { alt: 'Отделка панелями вокруг входной двери', width: 851, height: 1280 },
};

export const PROJECT_LABELS: Record<number, string> = {
  9: 'Фасад дома',
  10: 'Входная зона',
  4: 'Отделка террасы',
  3: 'Модульный дом',
  1: 'Деталь фасада',
  11: 'Оформление входа',
  5: 'Комбинированный фасад',
  7: 'Панели под навесом',
  2: 'Образец панели',
  6: 'Фактура ламелей',
  8: 'Образец панели',
};

/** Lightbox captions, printed in the order of GALLERY_ORDER. */
export const PHOTO_DESCRIPTIONS: Record<number, string> = {
  1: 'Вертикальные панели на фасаде рядом с окном',
  2: 'Образец панели с вертикальными ламелями',
  3: 'Модульный дом с панелями на переднем фасаде',
  4: 'Панели в отделке стены и потолка террасы',
  5: 'Компактное строение с комбинированным фасадом',
  6: 'Крупный план фактуры и ритма ламелей',
  7: 'Отделка панелями входной зоны под навесом',
  8: 'Образец фасадной панели на фоне тёмной стены',
  9: 'Дом с вертикальными панелями и двускатной крышей',
  10: 'Входная группа с вертикальными панелями',
  11: 'Отделка фасада вокруг входной двери',
};

export const GALLERY_ORDER = [9, 10, 4, 3, 1, 11, 5, 7, 2, 6, 8];

export const GALLERY_VISIBLE = GALLERY_ORDER.slice(0, 6);
export const GALLERY_MORE = GALLERY_ORDER.slice(6);

export const GALLERY_SIZES = '(max-width:700px) 100vw, (max-width:1100px) 50vw, 33vw';

export function photoSrc(id: number): string {
  return `/images/photo-${String(id).padStart(2, '0')}.webp`;
}
