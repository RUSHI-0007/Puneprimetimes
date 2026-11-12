export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Pune Prime Times',
  description:
    'Pune Prime Times is the premier digital news publication covering Pune, Baramati, Pimpri-Chinchwad, and Maharashtra with speed, depth, and integrity.',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Truth. Speed. Insight.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`
        : 'https://www.puneprimetimes.in',
  ogImage: '/og-image.jpg',
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


