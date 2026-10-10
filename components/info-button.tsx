'use client';

import type { ReactNode } from 'react';

import { useUI, type InfoKind } from '@/lib/ui';

export function InfoButton({ kind, children }: { kind: InfoKind; children: ReactNode }) {
  const { openInfo } = useUI();
  return (
    <button data-info={kind} onClick={() => openInfo(kind)}>
      {children}
    </button>
  );
}
