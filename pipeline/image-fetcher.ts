import https from 'https';
import http from 'http';
import { URL } from 'url';
import { StoryCluster } from './types';

/**
 * Fast, lightweight OpenGraph / Twitter Card image scraper.
 * Fetches the first ~60KB of an article URL to extract <meta property="og:image">.
 */
export async function fetchOgImage(targetUrl: string, timeoutMs = 4000): Promise<string | null> {
  // Skip Google News JS wrapper links as they require browser execution
  if (targetUrl.includes('news.google.com')) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(targetUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(
        targetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'mr-IN,mr;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          timeout: timeoutMs,
        },
        (res) => {
          // Follow HTTP redirects (301, 302, 307, 308)
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            try {
              const nextUrl = new URL(res.headers.location, targetUrl).href;
              return fetchOgImage(nextUrl, timeoutMs).then(resolve);
            } catch {
              return resolve(null);
            }
          }

          if (res.statusCode !== 200) {
            return resolve(null);
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            // Stop downloading once head section ends or payload exceeds 60KB
            if (data.includes('</head>') || data.length > 65536) {
              req.destroy();
            }
          });

          res.on('close', () => {
            const match =
              data.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
              data.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
              data.match(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

            if (match && match[1]) {
              let img = match[1].trim();
              if (img.startsWith('//')) {
                img = 'https:' + img;
              } else if (img.startsWith('/')) {
                try {
                  img = new URL(img, targetUrl).href;
                } catch {
                  return resolve(null);
                }
              }

              // Filter out logos, generic icons, tracking pixels, or small graphics
              const lower = img.toLowerCase();
              if (
                lower.includes('logo') ||
                lower.includes('default') ||
                lower.includes('favicon') ||
                lower.includes('placeholder') ||
                lower.includes('fallback') ||
                lower.includes('share-default') ||
                lower.includes('sprite') ||
                lower.endsWith('.svg') ||
                lower.endsWith('.ico')
              ) {
                return resolve(null);
              }

              resolve(img);
            } else {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Enriches a StoryCluster with authentic source imagery by checking each story URL.
 */
export async function enrichClusterWithOgImage(cluster: StoryCluster): Promise<string | null> {
  // If cluster already has an authentic RSS image, keep it
  if (cluster.imageUrl && cluster.imageUrl.startsWith('http')) {
    return cluster.imageUrl;
  }

  // Iterate through source links
  for (const item of cluster.items) {
    if (item.link) {
      try {
        const ogImage = await fetchOgImage(item.link);
        if (ogImage) {
          cluster.imageUrl = ogImage;
          console.log(`  📸 Found authentic source photo for "${cluster.headlineSummary.slice(0, 45)}...": ${ogImage}`);
          return ogImage;
        }
      } catch (err) {
        // Silently continue to next source item
      }
    }
  }

  return null;
}

