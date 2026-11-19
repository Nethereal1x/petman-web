// Структуровані дані schema.org для Google.
import { site } from './site';
import type { Service } from './services';

const DAY = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const abs = (path: string) => new URL(path, site.url).href;

export const clinicSchema = {
  '@context': 'https://schema.org',
  '@type': 'VeterinaryCare',
  '@id': abs('/#clinic'),
  name: site.name,
  alternateName: 'Петман',
  description:
    'Ветеринарна клініка у Львові для котів і собак: терапія, хірургія, стоматологія, лабораторна діагностика, чекап 8+, грумінг і зоомагазин.',
  url: abs('/'),
  telephone: site.phone,
  email: site.email,
  image: abs('/og.jpg'),
  logo: abs('/icon-512.png'),
  priceRange: '150–8000 грн',
  currenciesAccepted: 'UAH',
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: site.geo.lat,
    longitude: site.geo.lng,
  },
  hasMap: site.links.maps,
  areaServed: { '@type': 'City', name: 'Львів' },
  openingHoursSpecification: site.hours
    .filter((h) => h.open)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => DAY[d]),
      opens: h.open,
      closes: h.close,
    })),
  sameAs: [site.links.instagram, site.links.tiktok, site.links.telegram],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: abs('/'),
  name: site.name,
  inLanguage: 'uk',
  publisher: { '@id': abs('/#clinic') },
};

export function breadcrumbSchema(crumbs: [string, string][]) {
  const items: [string, string][] = [['Головна', '/'], ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function serviceSchema(service: Service) {
  const offers = service.prices.flatMap((group) =>
    group.rows
      .filter((row) => typeof row.price === 'number')
      .map((row) => ({
        '@type': 'Offer',
        name: group.rows.length > 1 && group.title !== row.name ? `${group.title}: ${row.name}` : row.name,
        priceCurrency: 'UAH',
        ...(row.from
          ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: row.price, priceCurrency: 'UAH' } }
          : { price: row.price }),
      })),
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(`/posluhy/${service.slug}/#service`),
    name: service.name,
    description: service.metaDescription,
    url: abs(`/posluhy/${service.slug}/`),
    serviceType: service.name,
    provider: { '@id': abs('/#clinic') },
    areaServed: { '@type': 'City', name: 'Львів' },
    ...(offers.length ? { offers } : {}),
  };
}
