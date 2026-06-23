'use client';

import { Crown, BookOpen, Code, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of Royal Mint and how to create your first collection.',
    links: ['Installation', 'Configuration', 'First Steps'],
  },
  {
    icon: Code,
    title: 'API Documentation',
    description: 'Complete API reference for integrating Royal Mint into your applications.',
    links: ['Authentication', 'Endpoints', 'Webhooks'],
  },
  {
    icon: Zap,
    title: 'Smart Contracts',
    description: 'Deep dive into our smart contract architecture and deployment guides.',
    links: ['Contract Overview', 'Deployment', 'Verification'],
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Security best practices and guidelines for protecting your collections.',
    links: ['Security Model', 'Audit Reports', 'Vulnerability Disclosure'],
  },
];

export default function DocsPage() {
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
              Documentation
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Royal Mint. Get started, explore our APIs, and build amazing NFT collections.
          </p>
        </motion.div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="royal-card group hover:border-crown/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-crown/10 rounded-lg group-hover:bg-crown/20 transition-colors">
                    <Icon className="h-6 w-6 text-crown" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {section.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.links.map((link) => (
                        <span
                          key={link}
                          className="text-xs px-2 py-1 bg-royal-500/20 text-crown rounded hover:bg-royal-500/30 transition-colors cursor-pointer"
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="royal-card text-center py-12"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Check our FAQ or contact us.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/faq">
              <Button variant="outline">FAQ</Button>
            </Link>
            <Link href="/contact">
              <Button className="gold-button">Contact Us</Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
