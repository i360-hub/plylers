import business from '../data/business.json';
import areas from '../data/areas.json';

const SITE = business.url; // https://www.plylerstreeservice.com

export const ORG_ID = `${SITE}/#organization`;
export const LOCALBUSINESS_ID = `${SITE}/#localbusiness`;
export const WEBSITE_ID = `${SITE}/#website`;

const sameAs = [
  business.social.facebook,
  business.social.googleMaps,
  business.social.bbb,
  business.social.yelp,
];

const openingHoursSpecification = business.hours.map((h) => ({
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: h.days,
  opens: h.opens,
  closes: h.closes,
}));

const areaServed = [
  ...areas.counties.map((name) => ({ '@type': 'AdministrativeArea', name })),
  ...areas.cities.map((name) => ({ '@type': 'City', name })),
];

const postalAddress = {
  '@type': 'PostalAddress',
  addressLocality: business.address.locality,
  addressRegion: business.address.region,
  postalCode: business.address.postalCode,
  addressCountry: business.address.country,
};

const geo = {
  '@type': 'GeoCoordinates',
  latitude: business.geo.lat,
  longitude: business.geo.lng,
};

const aggregateRating = {
  '@type': 'AggregateRating',
  ratingValue: business.rating.value,
  reviewCount: business.rating.count,
  bestRating: '5',
  worstRating: '1',
};

/** Stable global nodes present on every page. */
export function globalGraph() {
  const organization = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: business.name,
    url: `${SITE}/`,
    email: business.email,
    telephone: business.phoneSchema,
    image: `${SITE}/images/plylers-tree-service-logo.png`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE}/images/plylers-tree-service-logo.png`,
    },
    sameAs,
  };

  const localBusiness = {
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': LOCALBUSINESS_ID,
    name: business.name,
    url: `${SITE}/`,
    email: business.email,
    telephone: business.phoneSchema,
    priceRange: business.priceRange,
    image: `${SITE}/images/plylers-tree-service-logo.png`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE}/images/plylers-tree-service-logo.png`,
    },
    address: postalAddress,
    geo,
    areaServed,
    openingHoursSpecification,
    aggregateRating,
    sameAs,
    foundingDate: business.founded,
    founder: { '@type': 'Person', name: business.owner },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: business.phoneSchema,
      contactType: 'customer service',
      areaServed: 'US-AR',
      availableLanguage: 'English',
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: business.name,
    publisher: { '@id': ORG_ID },
  };

  return [organization, localBusiness, website];
}

/** Build a BreadcrumbList from [{name, path}] (path relative, e.g. "/about"). */
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE}${it.path === '/' ? '/' : it.path}`,
    })),
  };
}

/** FAQPage node from [{q, a}]. */
export function faqPage(qas: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: qas.map((x) => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a },
    })),
  };
}

/** Service node linked to the local business as provider. */
export function service(opts: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
  areaServed?: string[];
}) {
  return {
    '@type': 'Service',
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    provider: { '@id': LOCALBUSINESS_ID },
    areaServed: (opts.areaServed ?? areas.cities).map((name) => ({ '@type': 'City', name })),
  };
}

/** Compose the final @graph for a page. */
export function pageGraph(nodes: object[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [...globalGraph(), ...nodes],
  };
}

export { business, areas, SITE };
