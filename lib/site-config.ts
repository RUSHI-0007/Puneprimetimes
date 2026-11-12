function getCanonicalSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === 'development' && (!envUrl || envUrl.includes('localhost'))) {
    return envUrl || 'http://localhost:3000';
  }

  let raw = envUrl || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://www.puneprimetimes.in';
  raw = raw.trim().replace(/\/$/, '');
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = `https://${raw}`;
  }
  // Normalize apex domain to canonical www so WhatsApp crawlers don't hit 308 redirect
  if (raw === 'https://puneprimetimes.in' || raw === 'http://puneprimetimes.in') {
    raw = 'https://www.puneprimetimes.in';
  }
  return raw;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Pune Prime Times',
  description:
    'Pune Prime Times is the premier digital news publication covering Pune, Baramati, Pimpri-Chinchwad, and Maharashtra with speed, depth, and integrity.',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Truth. Speed. Insight.',
  url: getCanonicalSiteUrl(),
  ogImage: '/opengraph-image',
  links: {
    twitter: 'https://twitter.com/PunePrimeTimes',
    whatsapp: 'https://whatsapp.com/channel/PunePrimeTimes',
  },
  categories: [
    { name: 'City & Metro', slug: 'city-metro' },
    { name: 'Civic & Infra', slug: 'civic-infra' },
    { name: 'Tech & Innovation', slug: 'tech-innovation' },
    { name: 'Culture & Life', slug: 'culture-life' },
    { name: 'Business', slug: 'business' },
  ],
};


