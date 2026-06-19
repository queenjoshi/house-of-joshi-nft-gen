'use client';

import { Crown, Code, Zap, Shield, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

const API_SECTIONS = [
  {
    icon: Zap,
    title: 'REST API',
    description: 'Comprehensive REST API for integrating Royal Mint with your applications.',
    endpoints: [
      { method: 'GET', path: '/collections', description: 'List all collections' },
      { method: 'POST', path: '/collections', description: 'Create a new collection' },
      { method: 'GET', path: '/collections/:id', description: 'Get collection details' },
    ],
  },
  {
    icon: Code,
    title: 'Web3 Integration',
    description: 'Direct smart contract integration and Web3 utilities.',
    endpoints: [
      { method: 'POST', path: '/mint', description: 'Mint NFTs' },
      { method: 'POST', path: '/transfer', description: 'Transfer NFTs' },
      { method: 'GET', path: '/balance', description: 'Check wallet balance' },
    ],
  },
  {
    icon: Shield,
    title: 'Authentication',
    description: 'Secure authentication methods for API access.',
    endpoints: [
      { method: 'POST', path: '/auth/token', description: 'Get API token' },
      { method: 'POST', path: '/auth/validate', description: 'Validate token' },
      { method: 'POST', path: '/auth/refresh', description: 'Refresh token' },
    ],
  },
];

interface EndpointItemProps {
  method: string;
  path: string;
  description: string;
}

function EndpointItem({ method, path, description }: EndpointItemProps) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-400',
    POST: 'bg-green-500/20 text-green-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    DELETE: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-black/20 rounded-lg border border-royal-500/20 hover:border-crown/50 transition-colors">
      <span className={`px-3 py-1 rounded text-xs font-mono font-semibold ${methodColors[method]}`}>
        {method}
      </span>
      <span className="font-mono text-sm text-muted-foreground flex-1">{path}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}

export default function APIPage() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-crown" />
            <h1 className="text-4xl md:text-5xl font-display font-bold gold-text">
              API Reference
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build powerful applications with Royal Mint's comprehensive API.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="royal-card mb-12 p-8"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">Quick Start</h2>
          <div className="bg-black/40 rounded-lg p-6 font-mono text-sm mb-6 overflow-x-auto">
            <pre className="text-green-400">
{`// Example: Create a collection
const response = await fetch('https://api.royalmint.app/collections', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My NFT Collection',
    symbol: 'MYNFT',
    description: 'My first NFT collection',
  })
});`}
            </pre>
          </div>
          <Link href="/docs">
            <Button className="gold-button">View Full Documentation</Button>
          </Link>
        </motion.div>

        {/* API Sections */}
        <div className="space-y-8 mb-12">
          {API_SECTIONS.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + sectionIndex * 0.1 }}
                className="royal-card p-8"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-crown/10 rounded-lg">
                    <Icon className="h-6 w-6 text-crown" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-semibold mb-2">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {section.endpoints.map((endpoint, index) => (
                    <EndpointItem
                      key={`${endpoint.method}-${endpoint.path}`}
                      method={endpoint.method}
                      path={endpoint.path}
                      description={endpoint.description}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="royal-card text-center py-12"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get your API key and start building amazing applications with Royal Mint.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="gold-button">Get API Key</Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline">Read Documentation</Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
