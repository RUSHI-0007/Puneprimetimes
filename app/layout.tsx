import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { siteConfig } from '@/lib/site-config';
import { LanguageProvider } from '@/lib/i18n/language-context';
import './globals.css';

const siteBaseUrl = (() => {
  try {
    return new URL(siteConfig.url);
  } catch {
    return new URL('https://www.puneprimetimes.in');
  }
})();

export const metadata: Metadata = {
  metadataBase: siteBaseUrl,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'Pune News',
    'Pune Prime Times',
    'Maharashtra News',
    'Pune Metro',
    'Pimpri Chinchwad',
    'Breaking News Pune',
    'Pune Tech',
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr" className="scroll-smooth">
      <body className="min-h-screen flex flex-col font-sans">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

