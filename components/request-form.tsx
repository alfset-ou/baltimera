'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useUI } from '@/lib/ui';

type FieldName = 'name' | 'contact' | 'consent';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()\-]{7,}$/;

export function RequestForm() {
  const { openInfo } = useUI();
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);

  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<FieldName, string>>({
    name: '',
    contact: '',
    consent: '',
  });

  useEffect(() => {
    if (submitted) resultRef.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      nameRef.current?.focus();
    }
  }, [submitted]);

  const onSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = nameRef.current?.value.trim() ?? '';
    const contact = contactRef.current?.value.trim() ?? '';
    const consent = consentRef.current?.checked ?? false;

    const next: Record<FieldName, string> = {
      name: name ? '' : 'Укажите ваше имя.',
      contact: '',
      consent: consent ? '' : 'Подтвердите согласие с обработкой данных.',
    };

    const validContact = contact.includes('@')
      ? EMAIL.test(contact)
      : PHONE.test(contact) && contact.replace(/\D/g, '').length >= 7;
    next.contact = validContact ? '' : 'Укажите телефон или корректный e-mail.';

    setAttempted(true);
    setErrors(next);

    if (next.name) {
      nameRef.current?.focus();
      return;
    }
    if (next.contact) {
      contactRef.current?.focus();
      return;
    }
    if (next.consent) {
      consentRef.current?.focus();
      return;
    }
    setSubmitted(true);
  }, []);

  const onReset = useCallback(() => {
    returnFocus.current = true;
    setSubmitted(false);
  }, []);

  const describedBy = (field: FieldName) => (attempted ? `${field}-error` : undefined);
  const invalid = (field: FieldName) => (attempted ? errors[field] !== '' : undefined);

  return (
    <form className="inquiry-form" noValidate onSubmit={onSubmit}>
      <div className="form-row" hidden={submitted}>
        <label>
          Ваше имя
          <input
            ref={nameRef}
            name="name"
            autoComplete="name"
            required
            placeholder="Имя"
            aria-invalid={invalid('name')}
            aria-describedby={describedBy('name')}
          />
          <span className="field-error" id="name-error">
            {errors.name}
          </span>
        </label>
        <label>
          Телефон или e-mail
          <input
            ref={contactRef}
            name="contact"
            autoComplete="off"
            required
            placeholder="Ваш контакт"
            aria-invalid={invalid('contact')}
            aria-describedby={describedBy('contact')}
          />
          <span className="field-error" id="contact-error">
            {errors.contact}
          </span>
        </label>
      </div>
      <div className="form-row" hidden={submitted}>
        <label>
          Тип проекта
          <select name="audience">
            <option value="house">Частный дом</option>
            <option value="builder">Строительная компания</option>
            <option value="architect">Архитектор / дизайнер</option>
          </select>
        </label>
        <label>
          Что вам нужно?
          <select name="service">
            <option value="material">Только панели</option>
            <option value="installation">Панели и монтаж</option>
          </select>
        </label>
      </div>
      <label hidden={submitted}>
        Комментарий <span className="optional">необязательно</span>
        <textarea name="message" rows={3} placeholder="Коротко о вашем проекте"></textarea>
      </label>
      <label className="consent" hidden={submitted}>
        <input
          ref={consentRef}
          type="checkbox"
          name="consent"
          required
          aria-invalid={invalid('consent')}
          aria-describedby={describedBy('consent')}
        />
        <span>
          Согласен с{' '}
          <button type="button" data-info="privacy" onClick={() => openInfo('privacy')}>
            политикой конфиденциальности
          </button>
          .
        </span>
      </label>
      <span className="field-error" id="consent-error" hidden={submitted}>
        {errors.consent}
      </span>
      <button className="button submit" type="submit" hidden={submitted}>
        Отправить заявку
      </button>
      <div className="form-result" role="status" tabIndex={-1} hidden={!submitted} ref={resultRef}>
        <h3>Форма заполнена корректно</h3>
        <p>В прототипе данные не отправляются. После подключения бэкэнда здесь появится подтверждение заявки.</p>
        <button type="button" className="button reset-form" onClick={onReset}>
          Вернуться к форме
        </button>
      </div>
    </form>
  );
}
