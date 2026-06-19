'use client';

import { Crown, Wand2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function DreamWeaverPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-crown" />
            <h1 className="text-4xl md:text-5xl font-display font-bold gold-text">
              DreamWeaver
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8">
            Create stunning generative NFT art with our AI-powered platform.
          </p>

          <div className="royal-card p-12 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Wand2 className="h-12 w-12 text-crown" />
            </div>
            <p className="text-muted-foreground mb-8">
              Transform your creative vision into unique NFTs. DreamWeaver combines AI and creativity to generate infinite possibilities.
            </p>
            <Button className="gold-button" size="lg">
              Start Creating
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'AI-Powered', desc: 'Leverage cutting-edge AI for art generation' },
              { title: 'Infinite Variations', desc: 'Generate unique combinations endlessly' },
              { title: 'Easy Minting', desc: 'Deploy directly to Base blockchain' },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="royal-card p-6"
              >
                <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
