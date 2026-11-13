import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

// Auto-load .env.local and .env if present
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envFilePath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

import { SourceConfig, FeedItem, StoryCluster, PipelineRunReport, GeneratedArticleDraft } from './types';
import { RateLimiter } from './rate-limiter';
import { GeminiClient } from './gemini-client';
import { clusterStories } from './cluster';
import { writeArticleDraft } from './writer';

// Read arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldPublish = args.includes('--publish');
const puneArg = args.find((a) => a.startsWith('--pune-stories='));
const baramatiArg = args.find((a) => a.startsWith('--baramati-stories='));
const maxStoriesArg = args.find((a) => a.startsWith('--max-stories='));

// Default: 5 Pune stories + 5 Baramati stories (Total 10)
const PUNE_STORIES = puneArg ? parseInt(puneArg.split('=')[1], 10) : 5;
const BARAMATI_STORIES = baramatiArg ? parseInt(baramatiArg.split('=')[1], 10) : 5;
const MAX_STORIES = maxStoriesArg ? parseInt(maxStoriesArg.split('=')[1], 10) : (PUNE_STORIES + BARAMATI_STORIES);

const outputLanguages: ('mr' | 'en')[] = (process.env.OUTPUT_LANGUAGES || 'mr')
  .split(',')
  .map((l) => l.trim().toLowerCase() as 'mr' | 'en')
  .filter((l) => l === 'mr' || l === 'en');

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['source', 'sourceTag'],
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 12000
});

// Helper to detect story region (Pune vs Baramati)
function detectItemRegion(title: string, summary: string, sourceRegion?: 'pune' | 'baramati'): 'pune' | 'baramati' {
  if (sourceRegion === 'baramati') return 'baramati';
  const text = `${title} ${summary}`.toLowerCase();
  const baramatiKeywords = [
    'baramati',
    'बारामती',
    'baramatikar',
    'बारामतीकर',
    'malegaon bk',
    'माळेगाव',
    'someshwar',
    'सोमेश्वर',
    'supe',
    'सुपे',
    'morgaon',
    'मोरगाव',
    'daund',
    'दौंड',
    'indapur',
    'इंदापूर',
    'yugendra pawar',
    'युगेंद्र पवार',
    'sunetra pawar',
    'सुनेत्रा पवार',
    'vidya pratishthan',
    'विद्या प्रतिष्ठान',
    'katewadi',
    'काटेवाडी'
  ];
  if (baramatiKeywords.some((kw) => text.includes(kw))) {
    return 'baramati';
  }
  return 'pune';
}

// Helper to extract image URL from RSS item
function extractImageUrl(item: any): string | null {
  // 1. Enclosure check (e.g. Lokmat)
  if (item.enclosure?.url) {
    const u = item.enclosure.url;
    if (item.enclosure.type?.includes('image') || /\.(jpg|jpeg|png|webp)/i.test(u) || u.includes('/images/')) {
      return u;
    }
  }
  // 2. Media content check (e.g. Indian Express)
  if (Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
    const m = item.mediaContent[0];
    const u = m?.['$']?.url || m?.url;
    if (u) return u;
  }
  // 3. Media thumbnail check (e.g. ABP Majha)
  if (Array.isArray(item.mediaThumbnail) && item.mediaThumbnail.length > 0) {
    const m = item.mediaThumbnail[0];
    const u = m?.['$']?.url || m?.url;
    if (u) return u;
  }
  // 4. Embedded img tag in HTML content
  const html = item.contentEncoded || item.content || item.summary || item['content:encoded'] || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

// Helper for story hash
function getStoryHash(title: string, outlet: string): string {
  const norm = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(`${outlet}:${norm}`).digest('hex');
}

// Supabase client (using Service Role for background pipeline)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

// Fetch generic Pexels representative photo if API key provided
async function fetchOptionalPexelsImage(keywords: string[]): Promise<{ url: string | null; credit: string | null }> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || keywords.length === 0) return { url: null, credit: null };

  try {
    const query = encodeURIComponent(keywords.slice(0, 2).join(' '));
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
      headers: { Authorization: apiKey }
    });
    if (!res.ok) return { url: null, credit: null };
    const data = await res.json();
    const photo = data.photos?.[0];
    if (photo?.src?.large2x || photo?.src?.large) {
      return {
        url: photo.src.large2x || photo.src.large,
        credit: `Representative image: Pexels (${photo.photographer})`
      };
    }
  } catch (err: any) {
    console.warn(`[Pexels] Failed to fetch representative image: ${err.message}`);
  }
  return { url: null, credit: null };
}

async function runPipeline() {
  const startedAt = new Date().toISOString();
  console.log('================================================================');
  console.log(`🤖 PUNE PRIME TIMES - AI NEWS PIPELINE (${isDryRun ? 'DRY RUN' : 'PRODUCTION'})`);
  console.log(`⏰ Started at: ${startedAt}`);
  console.log(`🎯 Output Languages: ${outputLanguages.join(', ')} (Default: Marathi)`);
  console.log(`📊 Max Stories Per Run: ${MAX_STORIES}`);
  console.log('================================================================\n');

  const report: PipelineRunReport = {
    startedAt,
    status: 'running',
    sourcesChecked: 0,
    sourcesFailed: [],
    itemsFetched: 0,
    itemsDeduplicated: 0,
    clustersFormed: 0,
    eligibleClusters: 0,
    draftsCreated: 0,
    apiCallsUsed: 0,
    errors: [],
    drafts: []
  };

  const rateLimiter = new RateLimiter(
    parseInt(process.env.MIN_SECONDS_BETWEEN_CALLS || '6', 10),
    parseInt(process.env.DAILY_CALL_BUDGET || '300', 10)
  );

  const gemini = new GeminiClient(rateLimiter);
  const supabase = getSupabaseAdmin();

  // Load sources
  const sourcesFilePath = path.join(__dirname, 'sources.json');
  if (!fs.existsSync(sourcesFilePath)) {
    throw new Error(`sources.json not found at ${sourcesFilePath}`);
  }
  const sourcesConfig: SourceConfig[] = JSON.parse(fs.readFileSync(sourcesFilePath, 'utf-8'));

  // Step 1: Check existing processed items from Supabase to skip previously seen stories
  const processedUrlSet = new Set<string>();
  const processedHashSet = new Set<string>();

  if (supabase && !isDryRun) {
    try {
      const { data: processedItems } = await supabase
        .from('ai_processed_items')
        .select('url, story_hash')
        .order('created_at', { ascending: false })
        .limit(2000);

      (processedItems || []).forEach((row) => {
        if (row.url) processedUrlSet.add(row.url);
        if (row.story_hash) processedHashSet.add(row.story_hash);
      });
      console.log(`📦 Loaded ${processedUrlSet.size} previously processed URLs for deduplication.`);
    } catch (err: any) {
      console.warn(`[Supabase] Could not query ai_processed_items: ${err.message}. Proceeding without cache.`);
    }
  }

  // Step 2: Fetch feeds (< 24 hours)
  console.log('\n📡 Step 1: Fetching RSS feeds from trusted outlets...');
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const rawItems: FeedItem[] = [];

  for (const source of sourcesConfig) {
    if (source.active === false) {
      console.log(`⏩ Skipping disabled source: ${source.name} (${source.note || 'Disabled'})`);
      continue;
    }

    report.sourcesChecked++;
    try {
      const feed = await rssParser.parseURL(source.url);
      const items = feed.items || [];
      let sourceItemCount = 0;

      for (const item of items) {
        const link = (item.link || '').trim();
        const title = (item.title || '').trim();
        if (!link || !title) continue;

        // Date check: only within 24h if pubDate exists
        if (item.pubDate) {
          const itemTime = new Date(item.pubDate).getTime();
          if (!isNaN(itemTime) && now - itemTime > ONE_DAY_MS * 1.5) {
            continue; // older than 36h
          }
        }

        const summary = (item.contentSnippet || item.summary || item.content || '').replace(/<[^>]+>/g, '').trim();
        const imageUrl = extractImageUrl(item);

        // Extract clean outlet name and strip redundant suffix if from Google News
        const rawTag = item.sourceTag
          ? typeof item.sourceTag === 'string'
            ? item.sourceTag
            : item.sourceTag?.['_'] || ''
          : '';
        const itemOutlet = rawTag.trim() || source.outlet;
        let cleanTitle = title;
        if (rawTag.trim()) {
          const suffix = ` - ${rawTag.trim()}`;
          if (cleanTitle.endsWith(suffix)) {
            cleanTitle = cleanTitle.slice(0, -suffix.length).trim();
          }
        }

        const itemRegion = detectItemRegion(cleanTitle, summary, source.region);

        rawItems.push({
          id: `item-${rawItems.length + 1}`,
          title: cleanTitle,
          link,
          pubDate: item.pubDate || new Date().toISOString(),
          summary,
          outlet: itemOutlet,
          language: source.language,
          sourceName: source.name,
          region: itemRegion,
          imageUrl,
        });
        sourceItemCount++;
      }

      console.log(`  ✓ ${source.name}: Found ${sourceItemCount} recent items.`);
    } catch (err: any) {
      console.warn(`  ✗ ${source.name} (${source.url}): Failed to fetch feed (${err.message})`);
      report.sourcesFailed.push(`${source.name}: ${err.message}`);
    }
  }

  report.itemsFetched = rawItems.length;
  console.log(`Total raw items collected: ${rawItems.length}`);

  // Deduplicate by URL and filter out already processed URLs
  const uniqueItemsMap = new Map<string, FeedItem>();
  for (const it of rawItems) {
    if (processedUrlSet.has(it.link)) continue;
    const hash = getStoryHash(it.title, it.outlet);
    if (processedHashSet.has(hash)) continue;

    if (!uniqueItemsMap.has(it.link)) {
      uniqueItemsMap.set(it.link, it);
    }
  }

  const freshItems = Array.from(uniqueItemsMap.values());
  report.itemsDeduplicated = freshItems.length;
  console.log(`Fresh items after deduplication & history check: ${freshItems.length}`);

  if (freshItems.length === 0) {
    console.log('No new items to process today. Exiting cleanly.');
    report.status = 'success';
    report.completedAt = new Date().toISOString();
    return report;
  }

  // Step 3: Cluster items by story (Target: 5 Pune + 5 Baramati)
  console.log('\n🧩 Step 2: Clustering stories across outlets with Gemini Flash-Lite...');
  let clusters: StoryCluster[] = [];

  if (gemini.isConfigured()) {
    const puneFreshItems = freshItems.filter((i) => i.region === 'pune');
    const baramatiFreshItems = freshItems.filter((i) => i.region === 'baramati');

    console.log(`\n📊 Item breakdown by region:`);
    console.log(`  - Pune items: ${puneFreshItems.length}`);
    console.log(`  - Baramati items: ${baramatiFreshItems.length}`);

    console.log(`\n🧩 Step 2a: Clustering Pune stories (target: ${PUNE_STORIES})...`);
    const puneClusters = await clusterStories(puneFreshItems, gemini, PUNE_STORIES, 'pune');

    console.log(`\n🧩 Step 2b: Clustering Baramati stories (target: ${BARAMATI_STORIES})...`);
    const baramatiClusters = await clusterStories(baramatiFreshItems, gemini, BARAMATI_STORIES, 'baramati');

    clusters = [...puneClusters, ...baramatiClusters];
  } else {
    console.warn('⚠️ GEMINI_API_KEY is not set! Skipping AI clustering.');
  }

  report.clustersFormed = clusters.length;
  report.eligibleClusters = clusters.length;
  console.log(`Formed ${clusters.length} total story clusters (${clusters.filter((c) => c.region === 'pune').length} Pune + ${clusters.filter((c) => c.region === 'baramati').length} Baramati).`);

  // Step 4: Write Draft Articles
  console.log('\n✍️ Step 3: Verifying facts and generating draft articles...');

  // Fetch categories from Supabase to link category_id
  const categoryMap = new Map<string, string>(); // slug -> id
  if (supabase) {
    try {
      const { data: cats } = await supabase.from('categories').select('id, slug');
      (cats || []).forEach((c) => categoryMap.set(c.slug, c.id));
    } catch (e: any) {
      console.warn('[Supabase] Failed to fetch categories:', e.message);
    }
  }

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    console.log(`\n--- Story Cluster #${i + 1}/${clusters.length} ---`);
    console.log(`Headline: "${cluster.headlineSummary}"`);
    console.log(`Outlets (${cluster.outlets.length}): ${cluster.outlets.join(', ')}`);
    console.log(`Source items: ${cluster.items.length}`);

    for (const lang of outputLanguages) {
      console.log(`Drafting in [${lang.toUpperCase()}]...`);
      const draft = await writeArticleDraft(cluster, gemini, { language: lang });
      if (!draft) {
        console.warn(`Could not generate draft for cluster #${i + 1}`);
        report.errors.push({ step: 'writeArticleDraft', message: `Cluster ${cluster.headlineSummary}` });
        continue;
      }

      // Optional Pexels Stock Image
      const stockImage = await fetchOptionalPexelsImage(draft.image_keywords);

      report.drafts.push(draft);
      report.draftsCreated++;

      if (isDryRun) {
        console.log('\n=================== [DRY RUN DRAFT PREVIEW] ===================');
        console.log(`Title: ${draft.title}`);
        console.log(`Language: ${draft.language.toUpperCase()}`);
        console.log(`Slug: ${draft.slug}`);
        console.log(`Category: ${draft.categorySlug}`);
        console.log(`Confidence: ${draft.confidence.toUpperCase()}`);
        console.log(`Excerpt: ${draft.excerpt}`);
        console.log(`Verification Notes: ${draft.verification_notes}`);
        console.log(`Image Suggestion: ${draft.image_suggestion} (Keywords: ${draft.image_keywords.join(', ')})`);
        console.log(`Needs Careful Review: ${draft.flags.needs_careful_review ? '⚠️ YES' : 'NO'}`);
        console.log(`Sources (${draft.source_urls.length}):`);
        draft.source_urls.forEach((s) => console.log(`   - [${s.outlet}] ${s.url}`));
        console.log(`Tiptap JSON Content Blocks: ${draft.content.content.length} nodes`);
        console.log('=================================================================\n');
      } else if (supabase) {
        // Save to Supabase as DRAFT
        const categoryId = categoryMap.get(draft.categorySlug) || categoryMap.get('city-metro') || null;

        const finalCoverImage = cluster.imageUrl || stockImage.url || null;
        const imageCredit = cluster.imageUrl
          ? `Source: ${cluster.outlets.join(', ')}`
          : stockImage.credit;

        const status = shouldPublish ? 'published' : 'draft';
        const published_at = shouldPublish ? new Date().toISOString() : null;

        const { data: insertedArticle, error: articleErr } = await supabase
          .from('articles')
          .insert({
            title: draft.title,
            slug: `${draft.slug}-${Date.now().toString(36)}`, // guarantee uniqueness
            excerpt: draft.excerpt,
            content: draft.content,
            cover_image_url: finalCoverImage,
            category_id: categoryId,
            author_id: '896deeca-7aa3-4b60-85ae-532cf9448ee0', // Rohit Pawar
            status,
            language: draft.language,
            is_featured: false,
            is_breaking: false,
            published_at,
            ai_generated: true,
            confidence: draft.confidence,
            verification_notes: draft.verification_notes,
            image_suggestion: draft.image_suggestion,
            source_urls: draft.source_urls,
            flags: {
              ...draft.flags,
              region: cluster.region || draft.region || 'pune',
              image_credit: imageCredit,
              reporter_name: 'Rohit Pawar',
              reporter_email: 'puneprimetimes@gmail.com'
            }
          })
          .select('id, slug')
          .single();

        if (articleErr) {
          console.error(`[Supabase] Failed to save draft "${draft.title}":`, articleErr.message);
          report.errors.push({ step: 'saveDraft', message: articleErr.message });
        } else {
          console.log(`  ✓ Saved draft to Supabase! ID: ${insertedArticle?.id}`);

          // Record processed source URLs into ai_processed_items
          for (const item of cluster.items) {
            await supabase.from('ai_processed_items').upsert(
              {
                url: item.link,
                title: item.title,
                outlet: item.outlet,
                story_hash: getStoryHash(item.title, item.outlet),
                cluster_id: cluster.clusterId
              },
              { onConflict: 'url' }
            );
          }
        }
      }
    }
  }

  report.completedAt = new Date().toISOString();
  report.apiCallsUsed = gemini.getCallsUsed();
  report.status = report.errors.length === 0 ? 'success' : report.draftsCreated > 0 ? 'partial' : 'failed';

  // Save run log to Supabase
  if (supabase && !isDryRun) {
    try {
      await supabase.from('ai_run_logs').insert({
        started_at: report.startedAt,
        completed_at: report.completedAt,
        status: report.status,
        stories_found: report.itemsFetched,
        clusters_formed: report.clustersFormed,
        drafts_created: report.draftsCreated,
        skipped_count: report.itemsFetched - report.itemsDeduplicated,
        api_calls_used: report.apiCallsUsed,
        errors: report.errors,
        notes: `Sources checked: ${report.sourcesChecked}. Failed feeds: ${report.sourcesFailed.length}`
      });
      console.log('✓ Run metrics logged to ai_run_logs table in Supabase.');
    } catch (e: any) {
      console.warn('[Supabase] Failed to save ai_run_logs:', e.message);
    }
  }

  // Trigger ISR revalidation if published
  if (shouldPublish && report.draftsCreated > 0) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.puneprimetimes.in';
      const cleanSite = siteUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanSite}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/' })
      });
      const data = await res.json();
      console.log('✓ Triggered on-demand ISR revalidation for homepage:', data);
    } catch (err: any) {
      console.warn('Revalidation warning:', err.message);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 PIPELINE RUN COMPLETED');
  console.log(`Status: ${report.status}`);
  console.log(`Drafts Created: ${report.draftsCreated}`);
  console.log(`Gemini API Calls Used: ${report.apiCallsUsed}`);
  console.log('================================================================\n');

  return report;
}

// Execute
runPipeline().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});

