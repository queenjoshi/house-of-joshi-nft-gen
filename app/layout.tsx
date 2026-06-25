import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'House of Joshi Launchpad | NFT Launchpad on Base',
  description: 'Create, launch, and mint generative NFT collections on Base. The premier NFT launchpad with royalty-themed aesthetics.',
  metadataBase: new URL('https://nftlaunchpad.thehouseofjoshi.com'),
  themeColor: '#6E44FF',
  generator: 'Next.js',
  openGraph: {
    title: 'House of Joshi Launchpad | NFT Launchpad on Base',
    description: 'Create, launch, and mint generative NFT collections on Base. The premier NFT launchpad with royalty-themed aesthetics.',
    url: 'https://nftlaunchpad.thehouseofjoshi.com',
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
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'House of Joshi',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'House of Joshi',
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="House of Joshi" />
        <meta name="application-name" content="House of Joshi" />
        <meta name="theme-color" content="#6E44FF" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
