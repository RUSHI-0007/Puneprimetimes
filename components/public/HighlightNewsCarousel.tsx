'use client';

import { Carousel, AppleCard, type CarouselCardData } from '@/components/ui/apple-cards-carousel';
import { Highlighter } from '@/components/ui/highlighter';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Article, Category } from '@/lib/types';
import { Sparkles, Flame } from 'lucide-react';

interface HighlightNewsCarouselProps {
  articles: (Article & { category?: Category | null })[];
}

export default function HighlightNewsCarousel({
  articles,
}: HighlightNewsCarouselProps) {
  const { language, t } = useLanguage();

  if (!articles || articles.length === 0) return null;

  // Take top 4-6 highlight/breaking stories
  const highlightArticles = articles.slice(0, 6);

  const carouselCards: CarouselCardData[] = highlightArticles.map((art) => {
    const flags = art.flags as Record<string, any> | undefined;
    const title =
      language === 'en' && flags?.title_en
        ? flags.title_en
        : art.title;

    const excerpt =
      language === 'en' && flags?.excerpt_en
        ? flags.excerpt_en
        : art.excerpt;

    const category = art.category
      ? language === 'mr' && t.categories[art.category.slug]
        ? t.categories[art.category.slug]
        : art.category.name
      : 'Top News';

    return {
      id: art.id,
      src:
        art.cover_image_url ||
        'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      title,
      category,
      slug: art.slug,
      excerpt,
      publishedAt: art.published_at || art.created_at,
      isBreaking: art.is_breaking,
    };
  });

  const items = carouselCards.map((card, index) => (
    <AppleCard key={card.id} card={card} index={index} layout={true} />
  ));

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
            <Flame className="w-4 h-4 fill-red-600" />
            {language === 'mr' ? 'विशेष फोकस' : 'Breaking Focus'}
          </div>
          <h2 className="text-xl sm:text-3xl font-serif font-black text-neutral-900 dark:text-white">
            <Highlighter action="highlight" color="#fee2e2" strokeWidth={2}>
              {language === 'mr' ? 'संपादकीय विशेष' : "Editor's Spotlight"}
            </Highlighter>{' '}
            {language === 'mr' ? '& महत्त्वाच्या घडामोडी' : '& Key Dispatches'}
          </h2>
        </div>
        <p className="text-xs text-neutral-400">
          {language === 'mr'
            ? 'बातमी वाचण्यासाठी कार्डवर टॅप करा • आडवे स्वाइप करा'
            : 'Tap any card for quick summary • Swipe horizontally'}
        </p>
      </div>

      <Carousel items={items} />
    </section>
  );
}
