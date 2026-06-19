'use client';

import { Crown, Lock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function VaultPage() {
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
              Legacy Vault
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8">
            Securely store and manage your digital legacy and NFT collections.
          </p>

          <div className="royal-card p-12 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-crown" />
            </div>
            <p className="text-muted-foreground mb-8">
              Legacy Vault is your secure storage solution for preserving your most valuable NFTs and digital assets.
            </p>
            <a href="https://legacyvault.thehouseofjoshi.com/" target="_blank" rel="noopener noreferrer">
              <Button className="gold-button" size="lg">
                Access Legacy Vault
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Bank-Grade Security', desc: 'Military-grade encryption for your assets' },
              { title: 'Multi-Signature', desc: 'Enhanced protection with multiple approvals' },
              { title: 'Inheritance Ready', desc: 'Plan and secure your digital legacy' },
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
