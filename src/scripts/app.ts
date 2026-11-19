// Уся поведінка сайту в одному модулі: плавний скрол, анімації появи, перший екран,
// калькулятор, форма запису, статус «відчинено/зачинено», фільтр прайсу, карта.
// Кожна функція сама перевіряє, чи є на сторінці її елементи.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { site } from '../data/site';

declare global {
  interface Window {
    __petmanReady?: boolean;
  }
}

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const motion = root.classList.contains('motion');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, ctx: ParentNode = document) => ctx.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, ctx: ParentNode = document) =>
  Array.from(ctx.querySelectorAll<T>(sel));

let lenis: Lenis | null = null;

/* ───────────── Плавний скрол ───────────── */
function initScroll() {
  if (!motion || !finePointer) return;
  lenis = new Lenis({ lerp: 0.105, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ───────────── Шапка і меню ───────────── */
function initHeader() {
  const header = $('[data-header]');
  const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (!header) return;

  let lastY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (root.classList.contains('menu-open')) return;
      if (y > 240 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 240) header.classList.remove('is-hidden');
      lastY = y;
    },
    { passive: true },
  );

  if (!toggle || !menu) return;
  const setOpen = (open: boolean) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) lenis?.stop();
    else lenis?.start();
  };
  menu.toggleAttribute('inert', true);
  toggle.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ───────────── Відчинено / зачинено ───────────── */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_ACC = ['', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п’ятницю', 'у суботу', 'у неділю'];

function kyivNow(): { day: number; minutes: number } {
  const read = (timeZone: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read('Europe/Kyiv');
  } catch {
    parts = read('Europe/Kiev');
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = Number(get('hour')) % 24;
  return { day: WEEKDAYS.indexOf(get('weekday')) + 1, minutes: hour * 60 + Number(get('minute')) };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const hoursFor = (day: number) => site.hours.find((h) => (h.days as readonly number[]).includes(day));

function openState() {
  const now = kyivNow();
  const today = hoursFor(now.day);
  if (today?.open && today.close) {
    if (now.minutes >= toMinutes(today.open) && now.minutes < toMinutes(today.close)) {
      return { open: true, day: now.day, until: today.close, when: '' };
    }
    if (now.minutes < toMinutes(today.open)) {
      return { open: false, day: now.day, until: '', when: `сьогодні о ${today.open}` };
    }
  }
  for (let i = 1; i <= 7; i++) {
    const day = ((now.day - 1 + i) % 7) + 1;
    const next = hoursFor(day);
    if (next?.open) {
      return { open: false, day: now.day, until: '', when: `${i === 1 ? 'завтра' : DAY_ACC[day]} о ${next.open}` };
    }
  }
  return { open: false, day: now.day, until: '', when: '' };
}

function initOpenStatus() {
  const nodes = $$('[data-open-status]');
  const tables = $$('[data-hours]');
  if (!nodes.length && !tables.length) return;

  const render = () => {
    const state = openState();
    nodes.forEach((node) => {
      node.dataset.open = String(state.open);
      const text = $('[data-open-text]', node);
      const label = $('[data-open-label]', node);
      if (node.dataset.format === 'long') {
        if (label) label.textContent = state.open ? 'Зараз відчинено' : 'Зараз зачинено';
        if (text) text.textContent = state.open ? `до ${state.until}` : `Чекаємо ${state.when}`;
      } else if (text) {
        text.textContent = state.open ? `Відчинено до ${state.until}` : `Зачинено · ${state.when}`;
      }
    });
    tables.forEach((table) => {
      $$('tr', table).forEach((row) => row.classList.toggle('is-today', Number(row.dataset.day) === state.day));
    });
  };
  render();
  window.setInterval(render, 60_000);
}

/* ───────────── Перший екран ───────────── */
function initHero() {
  const hero = $('[data-hero]');
  if (!hero || !motion) return;

  const lines = $$('[data-hero-line]', hero);
  const fades = $$('[data-hero-fade]', hero);
  const circle = $('[data-hero-circle]', hero);
  const dog = $('[data-hero-dog]', hero);
  const dogPic = dog ? $('picture', dog) : null;
  const dogImg = dog ? $('img', dog) : null;
  const word = $('[data-hero-word]', hero);

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
  // Початкові стани задані в CSS (клас .motion), тому анімуємо до нуля в пікселях
  tl.to(lines, { y: 0, duration: 1.35, stagger: 0.11 }, 0)
    .to(dogPic, { y: 0, scale: 1, duration: 1.7 }, 0)
    .to(word, { x: 0, duration: 1.7 }, 0.1)
    .to(fades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.45)
    .to(circle, { scale: 1, rotation: 0, duration: 1.2, ease: 'back.out(1.5)' }, 0.55);

  // Поки наступний блок «накриває» перший екран, собака і слово їдуть у різні боки
  const next = hero.nextElementSibling as HTMLElement | null;
  if (next) {
    const st = { trigger: next, start: 'top bottom', end: 'top top', scrub: true };
    gsap.to(dog, { yPercent: -7, ease: 'none', scrollTrigger: st });
    gsap.to(word?.parentElement ?? null, { xPercent: -9, ease: 'none', scrollTrigger: st });
  }

  // Легкий паралакс за курсором
  if (finePointer && dogImg && word) {
    const dogX = gsap.quickTo(dogImg, 'x', { duration: 1.1, ease: 'power3.out' });
    const dogY = gsap.quickTo(dogImg, 'y', { duration: 1.1, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      dogX(nx * -26);
      dogY(ny * -14);
    });
  }
}

/* ───────────── Коло, що розкриває наступний блок ───────────── */
function initWipe() {
  const el = $('[data-wipe]');
  if (!el || !motion) return;
  const origin = () => {
    const circle = $('[data-hero-circle]');
    if (!circle) return Math.round(window.innerWidth * 0.14);
    const rect = circle.getBoundingClientRect();
    return Math.round(rect.left + rect.width / 2);
  };
  const radius = () => Math.round(Math.hypot(window.innerWidth, window.innerHeight) * 1.08);

  gsap.fromTo(
    el,
    { clipPath: () => `circle(0px at ${origin()}px 0px)` },
    {
      clipPath: () => `circle(${radius()}px at ${origin()}px 0px)`,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'top 12%',
        scrub: true,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        // Після розкриття знімаємо маску: секція вища за радіус кола
        if (this.progress() === 1) el.style.clipPath = 'none';
      },
    },
  );
}

/* ───────────── Поява тексту і блоків ───────────── */
function initSplit() {
  const els = $$('[data-split]');
  if (!els.length || !motion) return;
  document.fonts.ready.then(() => {
    els.forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, {
            yPercent: 108,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.085,
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          });
        },
      });
    });
  });
}

function initFill() {
  const els = $$('[data-fill]');
  if (!els.length || !motion) return;
  document.fonts.ready.then(() => {
    els.forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: true },
            },
          );
        },
      });
    });
  });
}

function initReveal() {
  const els = $$('[data-reveal]');
  if (!els.length || !motion) return;
  gsap.set(els, { autoAlpha: 0, y: 44 });
  ScrollTrigger.batch(els, {
    start: 'top 94%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.07,
        delay: (i, target) => Number((target as HTMLElement).dataset.revealDelay ?? 0),
        clearProps: 'transform',
      }),
  });
}

function initParallax() {
  if (!motion) return;
  $$('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax);
    gsap.fromTo(
      el,
      { yPercent: amount },
      {
        yPercent: -amount,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* ───────────── Лічильники ───────────── */
function initCount() {
  if (!motion) return;
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const state = { v: 0 };
    const write = () => {
      el.textContent = state.v.toFixed(decimals).replace('.', ',');
    };
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: write,
      onStart: write,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* ───────────── Магнітна кнопка ───────────── */
function initMagnetic() {
  if (!motion || !finePointer) return;
  $$('[data-magnetic]').forEach((el) => {
    const inner = $('[data-magnetic-inner]', el);
    const x = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
    const ix = inner ? gsap.quickTo(inner, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.45)' }) : null;
    const iy = inner ? gsap.quickTo(inner, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.45)' }) : null;
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      x(dx * 0.32);
      y(dy * 0.32);
      ix?.(dx * 0.14);
      iy?.(dy * 0.14);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
      ix?.(0);
      iy?.(0);
    });
  });
}

/* ───────────── Фото біля курсора у списку послуг ───────────── */
function initServiceFloat() {
  const list = $('[data-svc-list]');
  const float = list ? $('[data-svc-float]', list) : null;
  if (!list || !float || !finePointer || window.innerWidth <= 960) return;

  const imgs = $$<HTMLImageElement>('img', float);
  let loaded = false;
  const xTo = gsap.quickTo(float, 'x', { duration: 0.65, ease: 'power3.out' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.65, ease: 'power3.out' });
  const rTo = gsap.quickTo(float, 'rotation', { duration: 0.8, ease: 'power3.out' });
  let lastX = 0;
  gsap.set(float, { xPercent: 8, yPercent: -50, scale: 0.6, autoAlpha: 0 });

  const show = (on: boolean) =>
    gsap.to(float, {
      autoAlpha: on ? 1 : 0,
      scale: on ? 1 : 0.6,
      duration: on ? 0.55 : 0.35,
      ease: on ? 'expo.out' : 'power2.in',
      overwrite: 'auto',
    });

  $$('[data-svc]', list).forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      if (!loaded) {
        imgs.forEach((img) => (img.src = img.dataset.src!));
        loaded = true;
        gsap.set(float, { x: e.clientX, y: e.clientY });
      }
      imgs.forEach((img) => img.classList.toggle('is-on', img.dataset.name === row.dataset.img));
      show(true);
    });
  });
  list.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    rTo(gsap.utils.clamp(-9, 9, (e.clientX - lastX) * 0.45));
    lastX = e.clientX;
  });
  list.addEventListener('pointerleave', () => show(false));
}

/* ───────────── Картки кроків, що складаються стосом ───────────── */
function initSteps() {
  const steps = $$('[data-step]');
  if (steps.length < 2 || !motion) return;
  steps.forEach((step, i) => {
    const next = steps[i + 1];
    if (!next) return;
    gsap.to(step, {
      scale: 1 - (steps.length - 1 - i) * 0.035,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 25%', scrub: true },
    });
  });
}

/* ───────────── Відгуки ───────────── */
function initSlider() {
  $$('[data-slider]').forEach((slider) => {
    const slides = $$('[data-slide]', slider);
    const index = $('[data-slider-index]', slider);
    if (slides.length < 2) return;
    let current = 0;
    const go = (to: number) => {
      current = (to + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-on', i === current);
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      if (index) index.textContent = String(current + 1);
      if (motion) {
        gsap.fromTo(
          slides[current].children,
          { y: 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.95, ease: 'expo.out', stagger: 0.09, delay: 0.12 },
        );
      }
    };
    $('[data-slider-prev]', slider)?.addEventListener('click', () => go(current - 1));
    $('[data-slider-next]', slider)?.addEventListener('click', () => go(current + 1));

    let startX = 0;
    slider.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
    slider.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 48) go(current + (dx < 0 ? 1 : -1));
      },
      { passive: true },
    );
  });
}

/* ───────────── Запитання й відповіді ───────────── */
function initFaq() {
  $$<HTMLDetailsElement>('[data-faq] details').forEach((details) => {
    const summary = $('summary', details);
    const body = $('.faq__body', details);
    if (!summary || !body) return;
    let anim: Animation | null = null;

    summary.addEventListener('click', (e) => {
      if (!motion) return;
      e.preventDefault();
      anim?.cancel();
      const opening = !details.open;
      if (opening) details.open = true;
      const height = body.scrollHeight;
      anim = body.animate(
        { height: opening ? ['0px', `${height}px`] : [`${height}px`, '0px'], opacity: opening ? [0, 1] : [1, 0] },
        { duration: opening ? 520 : 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
      anim.onfinish = () => {
        if (!opening) details.open = false;
        anim = null;
        ScrollTrigger.refresh();
      };
    });
  });
}

/* ───────────── Калькулятор стерилізації / кастрації ───────────── */
type CalcEntry = { label: string; price?: number; bands?: [string, number, boolean?][] };

function initCalc() {
  const nf = new Intl.NumberFormat('uk-UA');
  $$('[data-calc]').forEach((calc) => {
    const data = JSON.parse(calc.dataset.prices ?? '{}') as Record<string, CalcEntry>;
    const weight = $<HTMLFieldSetElement>('[data-calc-weight]', calc);
    const label = $('[data-calc-label]', calc);
    const value = $('[data-calc-value]', calc);
    const from = $('[data-calc-from]', calc);
    if (!weight || !label || !value || !from) return;
    const state = { v: Number(value.textContent?.replace(/\D/g, '')) || 0 };
    const write = () => (value.textContent = nf.format(Math.round(state.v / 10) * 10));

    const update = () => {
      const who = $<HTMLInputElement>('input[name$="-who"]:checked', calc)?.value ?? 'catMale';
      const entry = data[who];
      const isDog = Boolean(entry.bands);
      weight.disabled = !isDog;
      let price = entry.price ?? 0;
      let text = entry.label;
      let isFrom = false;
      if (entry.bands) {
        const band = entry.bands[Number($<HTMLInputElement>('input[name$="-weight"]:checked', calc)?.value ?? 0)];
        price = band[1];
        isFrom = Boolean(band[2]);
        text = `${entry.label}, ${band[0]}`;
      }
      label.textContent = text;
      from.hidden = !isFrom;
      if (motion) {
        gsap.to(state, { v: price, duration: 0.7, ease: 'power3.out', onUpdate: write, overwrite: true });
      } else {
        state.v = price;
        write();
      }
    };
    calc.addEventListener('change', update);
  });
}

/* ───────────── Форма запису ───────────── */
function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('380')) digits = digits.slice(3);
  else if (digits.startsWith('80')) digits = digits.slice(2);
  // «067…» після вже підставленого +380: зайвий нуль прибираємо (коди операторів з нуля не починаються)
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return { text: parts.length ? `+380 ${parts.join(' ')}` : '', valid: digits.length === 9, e164: `+380${digits}` };
}

function initForm() {
  $$<HTMLFormElement>('[data-form]').forEach((form) => {
    const phone = $<HTMLInputElement>('[data-phone]', form);
    const state = $('[data-form-state]', form);
    const stateTitle = $('[data-form-state-title]', form);
    const stateText = $('[data-form-state-text]', form);

    const reason = new URLSearchParams(window.location.search).get('reason');
    const select = $<HTMLSelectElement>('select[name="reason"]', form);
    if (reason && select && Array.from(select.options).some((o) => o.value === reason)) select.value = reason;

    phone?.addEventListener('focus', () => {
      if (!phone.value) phone.value = '+380 ';
    });
    phone?.addEventListener('input', (e) => {
      if ((e as InputEvent).inputType?.startsWith('delete')) return;
      phone.value = formatPhone(phone.value).text || '+380 ';
    });
    phone?.addEventListener('blur', () => {
      if (phone.value.trim() === '+380') phone.value = '';
    });

    const setError = (name: string, on: boolean) => {
      $(`[data-error-for="${name}"]`, form)?.classList.toggle('is-on', on);
      const field = form.elements.namedItem(name) as HTMLInputElement | null;
      field?.setAttribute('aria-invalid', String(on));
    };
    form.addEventListener('input', (e) => {
      const name = (e.target as HTMLInputElement).name;
      if (name) setError(name, false);
    });

    const showState = (title: string, text: string) => {
      if (!state || !stateTitle || !stateText) return;
      stateTitle.textContent = title;
      stateText.textContent = text;
      state.hidden = false;
      if (motion) gsap.from(state.children, { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 });
      state.focus?.();
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('company')) return; // пастка для ботів

      const name = String(fd.get('name') ?? '').trim();
      const tel = formatPhone(String(fd.get('phone') ?? ''));
      const consent = fd.get('consent') === 'on';
      setError('name', name.length < 2);
      setError('phone', !tel.valid);
      setError('consent', !consent);
      if (name.length < 2 || !tel.valid || !consent) {
        (form.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus();
        return;
      }

      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        showState(
          'Онлайн-запис ще налаштовуємо',
          'Форма поки не під’єднана до клініки, тож заявку ми не отримали. Зателефонуйте або напишіть у Viber, і ми запишемо вас одразу.',
        );
        return;
      }

      form.setAttribute('aria-busy', 'true');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name,
            phone: tel.e164,
            pet: String(fd.get('pet') ?? '').trim(),
            reason: String(fd.get('reason') ?? ''),
            message: String(fd.get('message') ?? '').trim(),
            consent: true,
            consentAt: new Date().toISOString(),
            page: window.location.pathname,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        showState(
          'Дякуємо, заявку отримали',
          'Адміністратор зателефонує вам у робочий час, щоб підтвердити день і годину візиту.',
        );
        form.reset();
      } catch {
        showState(
          'Не вдалося надіслати',
          'Щось пішло не так із нашого боку. Зателефонуйте або напишіть у Viber, і ми запишемо вас одразу.',
        );
      } finally {
        form.removeAttribute('aria-busy');
      }
    });
  });
}

/* ───────────── Пошук у прайсі ───────────── */
function initPriceFilter() {
  const input = $<HTMLInputElement>('[data-price-filter]');
  if (!input) return;
  const groups = $$('[data-price-service]');
  const empty = $('[data-price-empty]');
  const norm = (s: string) =>
    s.toLowerCase().replace(/[’'ʼ`]/g, '').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  // Грубе відсікання закінчень, щоб «зуби» знаходило «зубів», а «кастрацію» — «кастрація»
  const stem = (w: string) => {
    if (w.length <= 3) return w;
    const s = w.replace(/(ами|ями|ого|ому|ими|ах|ях|ам|ям|ів|їв|ою|ею|ий|ій|их|ім|ом|ем)$/, '').replace(/[аеєиіїоуюяйь]+$/, '');
    return s.length >= 3 ? s : w.slice(0, 3);
  };

  const filter = () => {
    const words = norm(input.value).split(' ').filter(Boolean).map(stem);
    let total = 0;
    groups.forEach((group) => {
      const title = norm(group.dataset.priceService ?? '');
      let shown = 0;
      $$('[data-price-group]', group).forEach((sub) => {
        const subTitle = norm($('.price-group__head', sub)?.textContent ?? '');
        $$('[data-price-row]', sub).forEach((row) => {
          const hay = `${title} ${subTitle} ${norm(row.textContent ?? '')}`;
          const hit = words.every((w) => hay.includes(w));
          row.hidden = !hit;
          if (hit) shown++;
        });
        sub.hidden = !$$('[data-price-row]', sub).some((row) => !row.hidden);
      });
      group.hidden = shown === 0;
      total += shown;
    });
    if (empty) empty.hidden = total > 0;
    if (jumpLabel) {
      jumpLabel.textContent = !words.length
        ? 'Перейти до прайсу'
        : total
          ? `Показати знайдене · ${total}`
          : 'Нічого не знайдено';
    }
    ScrollTrigger.refresh();
  };

  const jumpLabel = $('[data-price-jump-label]');
  const jump = $<HTMLAnchorElement>('[data-price-jump]');
  const target = $('#pryis');
  // Lenis сам ловить якірні посилання; без нього прокручуємо нативно
  if (jump && target && !lenis) {
    jump.addEventListener('click', (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
    });
  }

  input.addEventListener('input', filter);
  // Enter у полі пошуку веде до результатів
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    jump?.click();
  });
  // Браузер може відновити текст у полі після «назад» — одразу застосовуємо фільтр
  if (input.value) filter();
}

/* ───────────── Карта ───────────── */
function initMap() {
  $$('[data-map]').forEach((box) => {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        const frame = document.createElement('iframe');
        frame.src = box.dataset.src ?? '';
        frame.title = 'Petman на карті Google';
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        box.append(frame);
      },
      { rootMargin: '500px 0px' },
    );
    io.observe(box);
  });
}

/* ───────────── Велике слово у футері ───────────── */
function initFooterWord() {
  const word = $('[data-footer-word]');
  const footer = word?.closest('footer');
  if (!word || !footer || !motion) return;
  // Слово виїжджає знизу на останньому відрізку скролу й стає на місце рівно в кінці сторінки
  gsap.from(word, {
    yPercent: 42,
    ease: 'none',
    scrollTrigger: {
      trigger: footer,
      start: () => `bottom bottom+=${word.offsetHeight}`,
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
}

function start() {
  initScroll();
  initHeader();
  initOpenStatus();
  initHero();
  initWipe();
  initSplit();
  initFill();
  initReveal();
  initParallax();
  initCount();
  initMagnetic();
  initServiceFloat();
  initSteps();
  initSlider();
  initFaq();
  initCalc();
  initForm();
  initPriceFilter();
  initMap();
  initFooterWord();
  window.__petmanReady = true;

  // Після завантаження шрифтів і картинок висоти змінюються: перераховуємо тригери
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

try {
  start();
} catch (error) {
  // Якщо щось зламалося, показуємо вміст без анімацій
  root.classList.remove('motion');
  console.error(error);
}
