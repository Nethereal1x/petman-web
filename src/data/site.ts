// Єдине джерело правди про клініку: контакти, графік, реквізити.
// Усе, що тут змінюється, оновлюється на всіх сторінках і в розмітці для Google.

export const site = {
  name: 'Petman',
  kind: 'ветеринарна клініка',
  slogan: 'До кожного — як до свого',
  url: 'https://petman.com.ua',
  locale: 'uk-UA',

  phone: '+380664677926',
  phoneDisplay: '066 467 79 26',
  email: 'petman.lviv@gmail.com',

  address: {
    street: 'вул. Антоновича, 115а',
    city: 'Львів',
    region: 'Львівська область',
    // TODO(клієнт): підтвердити індекс. На старому сайті 79029, у картці Google 79000, за OSM 79057.
    postalCode: '79057',
    country: 'UA',
    previous: 'вул. Городоцька, 209',
  },
  geo: { lat: 49.8269217, lng: 23.9931755 },

  // 1 = понеділок … 7 = неділя
  hours: [
    { days: [1, 2, 3, 4, 5], label: 'Пн–Пт', open: '10:00', close: '20:00' },
    { days: [6], label: 'Сб', open: '10:00', close: '18:00' },
    { days: [7], label: 'Нд', open: null, close: null },
  ],

  links: {
    viber: 'viber://chat?number=%2B380664677926',
    telegram: 'https://t.me/petmanLviv',
    instagram: 'https://www.instagram.com/petman.vet.shop',
    tiktok: 'https://www.tiktok.com/@petman.shop',
    maps: 'https://www.google.com/maps/search/?api=1&query=Petman!+%D0%B2%D1%83%D0%BB.+%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%BE%D0%B2%D0%B8%D1%87%D0%B0+115%D0%B0+%D0%9B%D1%8C%D0%B2%D1%96%D0%B2',
    route:
      'https://www.google.com/maps/dir/?api=1&destination=Petman!+%D0%B2%D1%83%D0%BB.+%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%BE%D0%B2%D0%B8%D1%87%D0%B0+115%D0%B0+%D0%9B%D1%8C%D0%B2%D1%96%D0%B2',
    mapEmbed:
      'https://www.google.com/maps?q=Petman!+%D0%B2%D1%83%D0%BB.+%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%BE%D0%B2%D0%B8%D1%87%D0%B0+115%D0%B0+%D0%9B%D1%8C%D0%B2%D1%96%D0%B2&z=16&hl=uk&output=embed',
  },

  // Дані з картки Google станом на дату аудиту. Оновлювати вручну разом із датою.
  rating: { value: 4.8, count: 82, fiveStar: 76, asOf: '2026-11-16' },

  // Дата, на яку актуальний прайс (показується біля кожної таблиці цін).
  pricesUpdated: '2026-11-13',

  // TODO(клієнт): заповнити перед запуском. Порожні поля показуються на сайті як помітні заглушки.
  legal: {
    owner: '', // напр. «ФОП Прізвище Ім'я По батькові»
    taxId: '', // РНОКПП або ЄДРПОУ
    license: '', // ліцензія на ветеринарну практику: номер, дата, хто видав
  },

  // Куди надсилати форму запису (POST, JSON). Задається змінною PUBLIC_FORM_ENDPOINT.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
} as const;

export const nav = [
  { href: '/posluhy/', label: 'Послуги' },
  { href: '/tsiny/', label: 'Ціни' },
  { href: '/komanda/', label: 'Команда' },
  { href: '/kontakty/', label: 'Контакти' },
] as const;

const nf = new Intl.NumberFormat('uk-UA');
const NBSP = ' ';

/** 2000 -> «2 000 грн» з нерозривними пробілами */
export function uah(value: number): string {
  return nf.format(value).replace(/\s/g, NBSP) + NBSP + 'грн';
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export const fullAddress = `${site.address.city}, ${site.address.street}`;
