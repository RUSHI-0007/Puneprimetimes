import { FeedItem, StoryCluster } from './types';
import { GeminiClient } from './gemini-client';

export async function clusterStories(
  items: FeedItem[],
  gemini: GeminiClient,
  maxStories: number = 6
): Promise<StoryCluster[]> {
  if (items.length === 0) return [];

  // Include all items across outlets for cross-referencing
  const itemsSummary = items.slice(0, 100).map((it, idx) => ({
    id: it.id,
    index: idx + 1,
    outlet: it.outlet,
    language: it.language,
    title: it.title,
    snippet: it.summary.slice(0, 120)
  }));

  const prompt = `You are a chief news editor cross-referencing news reports across Marathi and English outlets.
Analyze the following news headlines and summaries:

${JSON.stringify(itemsSummary, null, 2)}

TASK:
1. Identify stories that are covered by TWO OR MORE DIFFERENT news outlets (cross-outlet reporting).
   - Match Marathi and English reports covering the exact same event or development (e.g. a Pune accident, Pune Metro phase, Maharashtra political meeting, civic issue).
2. Discard any story reported by only one outlet.
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

    console.log('[Gemini Clustering Response]:', cleanedText);

    const parsed = JSON.parse(cleanedText);
    const rawClusters: any[] = parsed.clusters || [];

    const clusters: StoryCluster[] = [];

    for (let i = 0; i < rawClusters.length; i++) {
      const c = rawClusters[i];
      const clusterItems = items.filter((it) => (c.itemIds || []).includes(it.id));
      const uniqueOutlets = Array.from(new Set(clusterItems.map((it) => it.outlet)));
      
      // Strict rule: must have at least 2 distinct outlets
      if (uniqueOutlets.length >= 2) {
        clusters.push({
          clusterId: `cluster-${Date.now()}-${i}`,
          headlineSummary: c.headlineSummary || clusterItems[0]?.title || 'Cross-outlet Story',
          items: clusterItems,
          outlets: uniqueOutlets,
          languages: Array.from(new Set(clusterItems.map((it) => it.language))),
          categoryHint: c.categoryHint || 'general',
          firstSeen: clusterItems[0]?.pubDate || new Date().toISOString(),
          imageUrl: clusterItems.find((it) => it.imageUrl)?.imageUrl || null,
        });
      }
    }

    // Rank clusters by number of outlets descending, then number of items
    clusters.sort((a, b) => {
      if (b.outlets.length !== a.outlets.length) {
        return b.outlets.length - a.outlets.length;
      }
      return b.items.length - a.items.length;
    });

    return clusters.slice(0, maxStories);
  } catch (err: any) {
    console.warn(`[clusterStories] Failed to parse Gemini clustering: ${err.message}. Running rule-based fallback clusterer.`);
    return fallbackRuleBasedClustering(items, maxStories);
  }
}

/**
 * Fallback similarity grouping if Gemini JSON parsing or call fails
 */
function fallbackRuleBasedClustering(items: FeedItem[], maxStories: number): StoryCluster[] {
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
    if (uniqueOutlets.length >= 2) {
      processed.add(a.id);
      clusters.push({
        clusterId: `fallback-cluster-${i}`,
        headlineSummary: a.title,
        items: clusterItems,
        outlets: uniqueOutlets,
        languages: Array.from(new Set(clusterItems.map((it) => it.language))),
        categoryHint: 'general',
        firstSeen: a.pubDate,
        imageUrl: clusterItems.find((it) => it.imageUrl)?.imageUrl || null,
      });
    }
  }

  return clusters.slice(0, maxStories);
}

