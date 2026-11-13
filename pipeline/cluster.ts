import { FeedItem, StoryCluster } from './types';
import { GeminiClient } from './gemini-client';

export async function clusterStories(
  items: FeedItem[],
  gemini: GeminiClient,
  maxStories: number = 5,
  region?: 'pune' | 'baramati'
): Promise<StoryCluster[]> {
  if (items.length === 0) return [];

  const regionLabel = region === 'baramati' ? 'BARAMATI (Baramati taluka, MIDC, Pawar family, civic & rural politics)' : 'PUNE (Pune city, Pimpri-Chinchwad, PMC/PCMC, infrastructure)';

  // Include up to 80 items across outlets for cross-referencing
  const itemsSummary = items.slice(0, 80).map((it, idx) => ({
    id: it.id,
    index: idx + 1,
    outlet: it.outlet,
    language: it.language,
    title: it.title,
    snippet: it.summary.slice(0, 120)
  }));

  const prompt = `You are a chief news editor cross-referencing news reports across Marathi and English outlets specifically for ${regionLabel}.
Analyze the following news headlines and summaries:

${JSON.stringify(itemsSummary, null, 2)}

TASK:
1. Identify stories that are covered by TWO OR MORE DIFFERENT news outlets (cross-outlet reporting).
   - Match Marathi and English reports covering the exact same event or development.
2. If there are fewer than ${maxStories} multi-outlet stories, also select the top most impactful, newsworthy distinct single-outlet stories to fill up to ${maxStories} total stories.
3. Group the matched item IDs together into story clusters.

Return ONLY a valid JSON object with no markdown fences, matching this format:
{
  "clusters": [
    {
      "headlineSummary": "Concise headline summary of the shared story",
      "itemIds": ["id1", "id2"],
      "categoryHint": "civic" | "business" | "metro" | "politics" | "general",
      "confidence": "high" | "medium"
    }
  ]
}`;

  try {
    const { text } = await gemini.generateText(prompt);
    
    // Clean response of any markdown backticks
    const cleanedText = text
      .replace(/^```json/im, '')
      .replace(/^```/im, '')
      .replace(/```$/m, '')
      .trim();

    console.log(`[Gemini Clustering Response - ${region?.toUpperCase() || 'PUNE'}]:`, cleanedText.slice(0, 200) + '...');

    const parsed = JSON.parse(cleanedText);
    const rawClusters: any[] = parsed.clusters || [];

    const clusters: StoryCluster[] = [];
    const usedItemIds = new Set<string>();

    // Pass 1: Multi-outlet clusters (>= 2 outlets)
    for (let i = 0; i < rawClusters.length; i++) {
      const c = rawClusters[i];
      const clusterItems = items.filter((it) => (c.itemIds || []).includes(it.id));
      if (clusterItems.length === 0) continue;

      const uniqueOutlets = Array.from(new Set(clusterItems.map((it) => it.outlet)));
      
      if (uniqueOutlets.length >= 2) {
        clusterItems.forEach((it) => usedItemIds.add(it.id));
        clusters.push({
          clusterId: `cluster-${region || 'pune'}-${Date.now()}-${i}`,
          headlineSummary: c.headlineSummary || clusterItems[0]?.title || 'Cross-outlet Story',
          items: clusterItems,
          outlets: uniqueOutlets,
          languages: Array.from(new Set(clusterItems.map((it) => it.language))),
          categoryHint: c.categoryHint || 'general',
          firstSeen: clusterItems[0]?.pubDate || new Date().toISOString(),
          region: region || 'pune',
          imageUrl: clusterItems.find((it) => it.imageUrl)?.imageUrl || null,
        });
      }
    }

    // Pass 2: If we still need more stories to reach maxStories, include single-outlet high-value stories
    if (clusters.length < maxStories) {
      for (let i = 0; i < rawClusters.length && clusters.length < maxStories; i++) {
        const c = rawClusters[i];
        const clusterItems = items.filter((it) => (c.itemIds || []).includes(it.id) && !usedItemIds.has(it.id));
        if (clusterItems.length === 0) continue;

        const uniqueOutlets = Array.from(new Set(clusterItems.map((it) => it.outlet)));
        clusterItems.forEach((it) => usedItemIds.add(it.id));
        clusters.push({
          clusterId: `cluster-${region || 'pune'}-single-${Date.now()}-${i}`,
          headlineSummary: c.headlineSummary || clusterItems[0]?.title || 'Verified Story',
          items: clusterItems,
          outlets: uniqueOutlets,
          languages: Array.from(new Set(clusterItems.map((it) => it.language))),
          categoryHint: c.categoryHint || 'general',
          firstSeen: clusterItems[0]?.pubDate || new Date().toISOString(),
          region: region || 'pune',
          imageUrl: clusterItems.find((it) => it.imageUrl)?.imageUrl || null,
        });
      }
    }

    // Rank clusters by:
    // 1. Stories with authentic publisher photo (prioritized)
    // 2. Number of outlets descending (cross-outlet verification)
    // 3. Number of items
    clusters.sort((a, b) => {
      const aHasImg = a.imageUrl ? 1 : 0;
      const bHasImg = b.imageUrl ? 1 : 0;
      if (bHasImg !== aHasImg) {
        return bHasImg - aHasImg;
      }
      if (b.outlets.length !== a.outlets.length) {
        return b.outlets.length - a.outlets.length;
      }
      return b.items.length - a.items.length;
    });

    return clusters.slice(0, maxStories);
  } catch (err: any) {
    console.warn(`[clusterStories] Failed to parse Gemini clustering: ${err.message}. Running rule-based fallback clusterer.`);
    return fallbackRuleBasedClustering(items, maxStories, region);
  }
}

/**
 * Fallback similarity grouping if Gemini JSON parsing or call fails
 */
function fallbackRuleBasedClustering(items: FeedItem[], maxStories: number, region?: 'pune' | 'baramati'): StoryCluster[] {
  const clusters: StoryCluster[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (processed.has(a.id)) continue;

    const clusterItems: FeedItem[] = [a];
    const wordsA = new Set(
      a.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 4)
    );

    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (b.outlet === a.outlet || processed.has(b.id)) continue;

      const wordsB = b.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 4);

      let commonCount = 0;
      for (const w of wordsB) {
        if (wordsA.has(w)) commonCount++;
      }

      if (commonCount >= 2) {
        clusterItems.push(b);
        processed.add(b.id);
      }
    }

    const uniqueOutlets = Array.from(new Set(clusterItems.map((it) => it.outlet)));
    processed.add(a.id);
    clusters.push({
      clusterId: `fallback-cluster-${region || 'pune'}-${i}`,
      headlineSummary: a.title,
      items: clusterItems,
      outlets: uniqueOutlets,
      languages: Array.from(new Set(clusterItems.map((it) => it.language))),
      categoryHint: 'general',
      firstSeen: a.pubDate,
      region: region || 'pune',
      imageUrl: clusterItems.find((it) => it.imageUrl)?.imageUrl || null,
    });

    if (clusters.length >= maxStories) break;
  }

  return clusters.slice(0, maxStories);
}

