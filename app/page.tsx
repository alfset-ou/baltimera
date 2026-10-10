import { About } from '@/components/about';
import { ArchitectureBreak } from '@/components/architecture-break';
import { Hero } from '@/components/hero';
import { Manufacturing } from '@/components/manufacturing';
import { PanelModelSection } from '@/components/panel-model-section';
import { RequestSection } from '@/components/request-section';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Works } from '@/components/works';

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Works />
        <Manufacturing />
        <PanelModelSection />
        <ArchitectureBreak />
        <About />
        <RequestSection />
      </main>
      <SiteFooter />
    </>
  );
}
