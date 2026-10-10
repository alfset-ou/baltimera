'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PanelViewer, ViewerFinish } from '@/lib/panel-viewer';

const FINISH_CHOICES: { id: ViewerFinish; label: string; dotClass: string }[] = [
  { id: 'natural', label: 'Натуральный', dotClass: 'model-color-natural' },
  { id: 'black', label: 'Чёрный', dotClass: 'model-color-black' },
  { id: 'grey', label: 'Серый', dotClass: 'model-color-grey' },
];

const CANVAS_LABEL =
  'Интерактивная 3D модель фасадной панели. Перетаскивайте мышью или пальцем; колесо мыши или жест двумя пальцами приближают модель. Стрелки вращают, плюс и минус меняют масштаб, Home возвращает исходный вид.';

type Phase = 'idle' | 'ready' | 'active' | 'unavailable';

export function PanelModelSection() {
  const [finish, setFinish] = useState<ViewerFinish>('natural');
  const [phase, setPhase] = useState<Phase>('idle');
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<PanelViewer | null>(null);
  const startRef = useRef<Promise<void> | null>(null);
  const activateRequestedRef = useRef(false);
  const disposedRef = useRef(false);
  const finishRef = useRef<ViewerFinish>('natural');

  // The designer's static markup keeps the entry button hidden and reveals it
  // from JavaScript, so the model never invites a click it cannot answer.
  useEffect(() => {
    setScriptReady(true);
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
      startRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (startRef.current) return startRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    setLoading(true);
    const run = (async () => {
      // three.js and the CAD payload stay out of the initial bundle.
      const { createPanelViewer } = await import('@/lib/panel-viewer');
      const viewer = await createPanelViewer(canvas, { finish: finishRef.current });
      if (disposedRef.current) {
        viewer.dispose();
        return;
      }
      viewerRef.current = viewer;
      setLoading(false);
      if (activateRequestedRef.current) {
        viewer.activate();
        setPhase('active');
      } else {
        setPhase('ready');
      }
    })().catch(() => {
      setLoading(false);
      setPhase('unavailable');
    });
    startRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      },
      { rootMargin: '300px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [start]);

  const activate = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.activate();
    setPhase('active');
  }, []);

  // The designer's loader moved focus onto the canvas once the model became
  // interactive, so the arrow keys and +/- are reachable without a mouse.
  useEffect(() => {
    if (phase !== 'active') return;
    canvasRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const onEntryClick = useCallback(() => {
    if (phase === 'ready') {
      activate();
      return;
    }
    if (phase !== 'idle' || loading) return;
    activateRequestedRef.current = true;
    start();
  }, [activate, loading, phase, start]);

  const onFinishChoice = useCallback(
    (next: ViewerFinish) => {
      finishRef.current = next;
      setFinish(next);
      if (viewerRef.current) viewerRef.current.setFinish(next);
      else start();
    },
    [start],
  );

  const viewerClass = [
    'model-viewer',
    phase === 'ready' || phase === 'active' ? 'model-ready' : '',
    phase === 'active' ? 'model-active' : '',
    phase === 'unavailable' ? 'model-unavailable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="section panel-model-section" id="construction-3d" aria-labelledby="model-title">
      <div className="section-heading scroll-reveal">
        <span className="eyebrow" id="construction">
          Панель в деталях
        </span>
        <h2 id="model-title">Конструкция фасадных панелей</h2>
      </div>
      <div className="model-layout scroll-reveal">
        <dl className="model-specs model-specs-left">
          <div>
            <dt>Материал ламелей</dt>
            <dd>Термососна</dd>
          </div>
          <div>
            <dt>Формат панели</dt>
            <dd>451 × 2400 мм</dd>
          </div>
          <div>
            <dt>Рабочая ширина</dt>
            <dd>415 мм</dd>
          </div>
        </dl>
        <div className={viewerClass} id="panel-model" data-finish={finish} ref={rootRef}>
          <div className="model-stage">
            <canvas ref={canvasRef} tabIndex={phase === 'active' ? 0 : -1} role="img" aria-label={CANVAS_LABEL}></canvas>
            <Image
              className="model-fallback"
              src={`/images/panel-cad-preview-v19-${finish}.webp`}
              width={900}
              height={1200}
              sizes="(max-width:700px) 100vw, 760px"
              alt="Фасадная панель: шесть деревянных ламелей на профилированном стальном основании, вид из STEP-модели"
            />
            <button
              className="model-entry"
              type="button"
              hidden={!scriptReady || phase === 'unavailable'}
              disabled={loading || phase === 'active'}
              aria-busy={loading ? true : undefined}
              aria-hidden={phase === 'active' ? true : undefined}
              aria-label="Включить вращение и приближение 3D модели"
              onClick={onEntryClick}
            >
              <span className="model-entry-icon" aria-hidden="true">
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                  <path
                    d="M42 18a17 17 0 0 0-29-4M12 14v-8m0 8h8M12 36a17 17 0 0 0 29 4m1 0v8m0-8h-8"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m27 17 9 5v10l-9 5-9-5V22l9-5Zm0 10 9-5m-9 5-9-5m9 5v10"
                    stroke="currentColor"
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="model-entry-label">{loading ? 'Загружаем модель…' : 'Рассмотреть в 3D'}</span>
              <span className="model-entry-hint">Нажмите, чтобы вращать и приближать</span>
            </button>
          </div>
          <div className="model-colors" role="group" aria-label="Цвет деревянных ламелей">
            {FINISH_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="model-color"
                data-finish-choice={choice.id}
                aria-pressed={choice.id === finish}
                onClick={() => onFinishChoice(choice.id)}
              >
                <span className={`model-color-dot ${choice.dotClass}`} aria-hidden="true"></span>
                <span>{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
        <dl className="model-specs model-specs-right">
          <div>
            <dt>Основание</dt>
            <dd>Оцинкованная сталь</dd>
          </div>
          <div>
            <dt>Сечение ламели</dt>
            <dd>40 × 18 мм</dd>
          </div>
          <div>
            <dt>Покрытие основания</dt>
            <dd>Granite® Ultramat</dd>
          </div>
        </dl>
      </div>
      <p className="model-steel-spec">Сталь ArcelorMittal · Покрытие 35 мкм · Матовый чёрный RAL 9005</p>
    </section>
  );
}
