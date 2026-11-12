import { StoryCluster, GeneratedArticleDraft } from './types';
import { GeminiClient } from './gemini-client';
import { slugify } from '../lib/utils/slugify';

interface WriterOptions {
  language?: 'mr' | 'en';
}

/**
 * Builds standard Tiptap JSON document from structured paragraphs and sources
 */
export function buildTiptapDoc(
  paragraphs: string[],
  sources: { outlet: string; url: string; title: string }[],
  language: 'mr' | 'en' = 'mr'
): { type: 'doc'; content: any[] } {
  const contentBlocks: any[] = [];

  for (const p of paragraphs) {
    if (!p.trim()) continue;
    contentBlocks.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: p.trim()
        }
      ]
    });
  }

  // Append Sources section
  if (sources.length > 0) {
    const headingText = language === 'mr' ? 'संदर्भ व स्रोत (Sources):' : 'Sources & References:';
    contentBlocks.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: headingText,
          marks: [{ type: 'bold' }]
        }
      ]
    });

    const sourceParagraphContent: any[] = [];
    sources.forEach((s, idx) => {
      sourceParagraphContent.push({
        type: 'text',
        text: `• ${s.outlet}: `
      });
      sourceParagraphContent.push({
        type: 'text',
        text: s.title || s.url,
        marks: [
          {
            type: 'link',
            attrs: {
              href: s.url,
              target: '_blank'
            }
          }
        ]
      });
      if (idx < sources.length - 1) {
        sourceParagraphContent.push({
          type: 'text',
          text: ' | '
        });
      }
    });

    contentBlocks.push({
      type: 'paragraph',
      content: sourceParagraphContent
    });
  }

  return {
    type: 'doc',
    content: contentBlocks
  };
}

export async function writeArticleDraft(
  cluster: StoryCluster,
  gemini: GeminiClient,
  options: WriterOptions = {}
): Promise<GeneratedArticleDraft | null> {
  const language = options.language || 'mr';

  const sourcesSummary = cluster.items.map((it, idx) => ({
    sourceId: idx + 1,
    outlet: it.outlet,
    headline: it.title,
    summary: it.summary,
    url: it.link,
    publishedAt: it.pubDate
  }));

  const langInstruction =
    language === 'mr'
      ? `Write the title, excerpt, and article body paragraphs strictly in professional, grammatically polished MARATHI (मराठी). (Provide a URL-friendly English slug for URL safety).`
      : `Write the title, excerpt, and article body paragraphs strictly in objective, polished ENGLISH.`;

  const prompt = `You are a senior investigative news editor for Pune Prime Times (पुणे प्राईम टाईम्स).
You have reports from multiple verified news outlets about a breaking or developing event:

${JSON.stringify(sourcesSummary, null, 2)}

TASK:
Verify the facts across these reports and draft an ORIGINAL, fact-checked news article.

LANGUAGE INSTRUCTION:
${langInstruction}

STRICT JOURNALISTIC RULES:
1. TRUTH & SOURCING: Use ONLY verified facts supported by the sources above. Never invent names, numbers, causes, quotes, or background.
2. CONSENSUS RULE: Include a fact in the main narrative only if at least 2 outlets agree on it. If a detail is reported by only 1 outlet, omit it or note it in "verification_notes" as single-sourced.
3. CONFLICTS: If outlets contradict each other (e.g. differing casualties, timing, or statements), state the discrepancy neutrally in "verification_notes" and use cautious language.
4. FRESH PROSE: Write in fresh, original words. NEVER copy verbatim phrases from the outlets. Maximum ONE short quote (under 15 words), strictly attributed (e.g., "..." असे पुणे पोलिसांनी सांगितले).
5. SENSITIVE TOPICS / SAFETY:
   - If the story involves active crime investigations naming minors or sexual assault victims, communal/religious tension, or unconfirmed fatalities, set "needs_careful_review": true and note why in verification_notes.
6. IMAGE SUGGESTION: DO NOT suggest downloading images from the source outlets. Instead, describe a generic representative photograph (e.g. "Pune Metro train on elevated viaduct at sunset") and provide 3 relevant search keywords.

Respond strictly with a JSON object (no markdown fences):
{
  "title": "Clear, informative headline in ${language === 'mr' ? 'Marathi' : 'English'}",
  "slug": "url-friendly-english-slug-separated-by-hyphens",
  "excerpt": "A concise 1-2 sentence lead summary (under 250 characters)",
  "paragraphs": [
    "Opening lead paragraph answering who, what, where, when.",
    "Second paragraph detailing key confirmed facts and official quotes/statements.",
    "Third paragraph providing context, civic impact, or next steps."
  ],
  "confidence": "high" | "medium" | "low",
  "verification_notes": "Detailed notes on facts cross-checked, agreement between outlets, single-source details, or any discrepancies noted.",
  "image_suggestion": "Description of a suitable stock/representative photo",
  "image_keywords": ["keyword1", "keyword2", "keyword3"],
  "categorySlug": "civic-infra" | "city-metro" | "business" | "tech-innovation" | "culture-life",
  "needs_careful_review": false
}`;

  try {
    // Attempt with Google Search grounding tool first to verify latest facts
    const { text, grounded } = await gemini.generateText(prompt, { withGrounding: true });

    const cleanedText = text
      .replace(/^```json/im, '')
      .replace(/^```/im, '')
      .replace(/```$/m, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    // Build standard source URLs list
    const sourceUrls = cluster.items.map((it) => ({
      outlet: it.outlet,
      url: it.link,
      title: it.title
    }));

    // Ensure English URL-safe slug
    const safeSlug = parsed.slug ? slugify(parsed.slug) : slugify(cluster.headlineSummary);

    // Build Tiptap JSON content doc
    const tiptapDoc = buildTiptapDoc(parsed.paragraphs || [], sourceUrls, language);

    // Confidence adjustment: if grounding wasn't available, max confidence is medium
    let confidence: 'high' | 'medium' | 'low' = parsed.confidence || 'medium';
    if (!grounded && confidence === 'high' && cluster.outlets.length < 3) {
      confidence = 'medium';
    }

    return {
      title: parsed.title,
      slug: safeSlug,
      excerpt: parsed.excerpt,
      language,
      categorySlug: parsed.categorySlug || 'city-metro',
      content: tiptapDoc,
      confidence,
      verification_notes: parsed.verification_notes || `Cross-referenced across ${cluster.outlets.join(', ')}.`,
      image_suggestion: parsed.image_suggestion || 'Representative image of Pune city',
      image_keywords: parsed.image_keywords || ['Pune', 'News'],
      flags: {
        needs_careful_review: Boolean(parsed.needs_careful_review),
        cluster_size: cluster.items.length,
        outlets: cluster.outlets,
        grounded
      },
      source_urls: sourceUrls
    };
  } catch (err: any) {
    console.error(`[writeArticleDraft] Error drafting cluster "${cluster.headlineSummary}":`, err.message);
    return null;
  }
}

