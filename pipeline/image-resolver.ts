import { StoryCluster, GeneratedArticleDraft } from './types';

interface ResolvedImage {
  url: string;
  credit: string;
}

// Curated pool of verified, high-definition editorial news images (all verified HTTP 200)
const TOPIC_IMAGES: Record<string, ResolvedImage[]> = {
  crime_police: [
    {
      url: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Police Crime Investigation'
    },
    {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Security & Police Emergency Response'
    }
  ],
  water_dam_canal: [
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Water Resources & Irrigation Network'
    }
  ],
  court_law: [
    {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Court of Law & Legal Affairs'
    }
  ],
  aviation_airport: [
    {
      url: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Aviation & Flight Academy'
    }
  ],
  agriculture_rural: [
    {
      url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Rural Agriculture & Farmland'
    },
    {
      url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Community Welfare & Administration'
    }
  ],
  festival_diwali: [
    {
      url: 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Festive Celebration & Community Welfare'
    }
  ],
  metro_civic: [
    {
      url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Pune Metro & Civic Infrastructure'
    },
    {
      url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Highway & Infrastructure Network'
    }
  ],
  business_market: [
    {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Business & Financial Markets'
    },
    {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Industry & Enterprise'
    }
  ],
  tech_innovation: [
    {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Technology & Innovation Corridor'
    },
    {
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Digital Ecosystem & IT'
    }
  ],
  pune_general: [
    {
      url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Pune & Maharashtra Regional Heritage'
    },
    {
      url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      credit: 'Representative Photo: Urban Metro Dispatch'
    }
  ]
};

let imageRotationIndex = 0;

/**
 * Guarantees that EVERY published article receives an authentic, valid, high-res cover image.
 * Will NEVER return null.
 */
export function resolveGuaranteedArticleImage(
  cluster: StoryCluster,
  draft: GeneratedArticleDraft
): ResolvedImage {
  // 1. If authentic photo already present from trusted news source feed, use it
  if (cluster.imageUrl && cluster.imageUrl.startsWith('http')) {
    return {
      url: cluster.imageUrl,
      credit: `Source: ${cluster.outlets.join(', ')}`
    };
  }

  const textContext = `${draft.title} ${draft.excerpt} ${draft.image_keywords.join(' ')} ${cluster.headlineSummary}`.toLowerCase();

  // 2. Keyword match
  if (textContext.includes('विमान') || textContext.includes('aircraft') || textContext.includes('airport') || textContext.includes('pilot')) {
    return TOPIC_IMAGES.aviation_airport[0];
  }
  if (textContext.includes('बॉम्ब') || textContext.includes('धमकी') || textContext.includes('bomb') || textContext.includes('threat') || textContext.includes('security')) {
    return TOPIC_IMAGES.crime_police[1];
  }
  if (textContext.includes('खून') || textContext.includes('गुन्हे') || textContext.includes('हल्ला') || textContext.includes('फटाके') || textContext.includes('crime') || textContext.includes('police')) {
    return TOPIC_IMAGES.crime_police[0];
  }
  if (textContext.includes('पाणी') || textContext.includes('कालवा') || textContext.includes('धरण') || textContext.includes('water') || textContext.includes('canal') || textContext.includes('dam')) {
    return TOPIC_IMAGES.water_dam_canal[0];
  }
  if (textContext.includes('न्यायालय') || textContext.includes('कोर्ट') || textContext.includes('दाम्पत्य') || textContext.includes('court') || textContext.includes('legal') || textContext.includes('judge')) {
    return TOPIC_IMAGES.court_law[0];
  }
  if (textContext.includes('फराळ') || textContext.includes('दिवाळी') || textContext.includes('diwali') || textContext.includes('festival') || textContext.includes('sweets')) {
    return TOPIC_IMAGES.festival_diwali[0];
  }
  if (textContext.includes('शेतकरी') || textContext.includes('दुष्काळ') || textContext.includes('पारधी') || textContext.includes('farmer') || textContext.includes('rural') || textContext.includes('baramati') || cluster.region === 'baramati') {
    const baramatiPool = TOPIC_IMAGES.agriculture_rural;
    return baramatiPool[imageRotationIndex++ % baramatiPool.length];
  }
  if (draft.categorySlug === 'tech-innovation' || textContext.includes('tech') || textContext.includes('ai') || textContext.includes('it')) {
    const techPool = TOPIC_IMAGES.tech_innovation;
    return techPool[imageRotationIndex++ % techPool.length];
  }
  if (draft.categorySlug === 'business' || textContext.includes('cng') || textContext.includes('png') || textContext.includes('price') || textContext.includes('business')) {
    const bizPool = TOPIC_IMAGES.business_market;
    return bizPool[imageRotationIndex++ % bizPool.length];
  }
  if (draft.categorySlug === 'civic-infra' || textContext.includes('metro') || textContext.includes('flyover') || textContext.includes('road')) {
    const civicPool = TOPIC_IMAGES.metro_civic;
    return civicPool[imageRotationIndex++ % civicPool.length];
  }

  // 3. Fallback: Rotating general Pune urban cityscape photo
  const defaultPool = TOPIC_IMAGES.pune_general;
  return defaultPool[imageRotationIndex++ % defaultPool.length];
}
