'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Crown,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';


const FEATURES = [
  {
    icon: Sparkles,
    title: 'Generative Art',
    description: 'Create unique, algorithmically generated NFT collections with customizable layers and rarity.',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Deploy your smart contract to Base in minutes with our streamlined deployment wizard.',
  },
  {
    icon: Shield,
    title: 'Secure & Verified',
    description: 'All contracts are audited. Verified collections get premium placement and trust badges.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Track your collection performance with real-time minting data and holder analytics.',
  },
  {
    icon: Users,
    title: 'Referral System',
    description: 'Grow your community with built-in referral tracking and reward distribution.',
  },
  {
    icon: Crown,
    title: 'Royalty Management',
    description: 'Set and enforce secondary royalties. Your art, your earnings, forever.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-royal-950/50 via-background to-background" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-crown/20 via-transparent to-transparent blur-3xl" />

          <div className="container relative px-4 py-16 sm:py-20 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-royal-500/20 border border-royal-500/30"
              >
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-crown" />
                <span className="text-xs sm:text-sm font-medium">Built on Base</span>
              </motion.div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 text-balance">
                <span className="block">Create & Launch</span>
                <span className="gold-text">NFT Collections</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto text-balance px-2">
                The premier NFT launchpad for generative art collections. Build, deploy, and mint with elegance on Base network.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                <Link href="/launchpad" className="w-full sm:w-auto">
                  <Button size="lg" className="gold-button text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Create Collection
                  </Button>
                </Link>
                <Link href="/collections" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="royal-border text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                    Explore Collections
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-24">
          <div className="container px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                Everything You Need to Launch
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto px-2">
                From art generation to smart contract deployment, House of Joshi Launchpad provides
                all the tools you need for a successful NFT launch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="royal-card h-full hover:shadow-royal transition-shadow">
                    <CardHeader>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-royal-500/20 to-gold-500/20 flex items-center justify-center mb-3 sm:mb-4">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-crown" />
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg">
                        {feature.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-transparent via-royal-950/30 to-transparent">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto text-center royal-card-gold p-6 sm:p-8 md:p-12 lg:p-16"
            >
              <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-crown mx-auto mb-4 sm:mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Ready to Create Your Collection?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto px-2">
                Join thousands of creators who have launched their NFT collections on House of Joshi Launchpad. Start building your empire today.
              </p>
              <Link href="/launchpad">
                <Button size="lg" className="gold-button text-base sm:text-lg px-8 sm:px-10 md:px-12">
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Start Creating
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
