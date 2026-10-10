import { RequestForm } from '@/components/request-form';

export function RequestSection() {
  return (
    <section className="section request-section" id="request" aria-labelledby="request-title">
      <div className="request-card scroll-reveal">
        <div className="request-copy">
          <span className="eyebrow">Заявка</span>
          <h2 id="request-title">
            Получите предложение
            <br />
            для вашего фасада
          </h2>
          <p>Оставьте контакт и укажите, нужны ли вам только панели или панели с монтажом.</p>
        </div>
        <RequestForm />
      </div>
    </section>
  );
}
