import Image from 'next/image';

export function ArchitectureBreak() {
  return (
    <figure
      className="architecture-break scroll-reveal"
      aria-label="Архитектурная визуализация дома с фасадными панелями"
    >
      <Image
        src="/images/architecture-scene-v13.webp"
        width={1672}
        height={941}
        sizes="100vw"
        alt="Архитектурная визуализация современного дома с тёплыми вертикальными ламелями среди сосен"
        decoding="async"
      />
    </figure>
  );
}
