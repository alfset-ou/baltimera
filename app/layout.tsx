import type { Metadata, Viewport } from 'next';

import './globals.css';

import { SiteEffects } from '@/components/site-effects';
import { INTRO_BOOT_SCRIPT } from '@/lib/intro-boot';
import { UIProvider } from '@/lib/ui';

export const metadata: Metadata = {
  title: 'Фасадные панели: производство, продажа и монтаж — Baltimera',
  description:
    'Современные фасадные панели Baltimera для домов и входных зон. Производство и продажа, монтаж по желанию. Посмотрите фотографии и оставьте заявку.',
  icons: { icon: [{ url: '/images/logo-mark.svg', type: 'image/svg+xml' }] },
  openGraph: {
    title: 'Современные фасадные панели — Baltimera',
    description: 'Производство и продажа фасадных панелей. Материал отдельно или с монтажом.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#F6F3EE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script
          id="baltimera-intro"
          dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }}
        />
        <link rel="preload" href="/fonts/inter-400.woff" as="font" type="font/woff" crossOrigin="" />
        {/* First-visit entrance screen; the boot script decides whether it plays. */}
        <div className="site-intro" aria-hidden="true">
          <div className="intro-brand">
            <img src="/images/logo-mark-light.svg" width={320} height={300} alt="" />
            <span>Baltimera</span>
          </div>
        </div>
        <UIProvider>{children}</UIProvider>
        <SiteEffects />
      </body>
    </html>
  );
}
