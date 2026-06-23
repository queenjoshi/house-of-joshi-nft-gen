import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'House of Joshi Launchpad | NFT Launchpad on Base',
  description: 'Create, launch, and mint generative NFT collections on Base. The premier NFT launchpad with royalty-themed aesthetics.',
  metadataBase: new URL('https://thehouseofjoshi.com'),
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a0a2e' },
  ],
  openGraph: {
    title: 'House of Joshi Launchpad | NFT Launchpad on Base',
    description: 'Create, launch, and mint generative NFT collections on Base. The premier NFT launchpad with royalty-themed aesthetics.',
    url: 'https://thehouseofjoshi.com',
    siteName: 'House of Joshi',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'House of Joshi - NFT Launchpad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'House of Joshi Launchpad | NFT Launchpad on Base',
    description: 'Create, launch, and mint generative NFT collections on Base.',
    images: ['/og-image.png'],
    creator: '@thehouseofjoshi',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
