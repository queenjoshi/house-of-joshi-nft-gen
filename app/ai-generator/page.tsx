import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock3, Layers3, Sparkles, Wand2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'AI NFT Generator — Coming Soon | House of Joshi',
  description: 'The House of Joshi AI NFT Generator is currently in development.',
};

const UPCOMING_FEATURES = [
  {
    icon: Wand2,
    title: 'AI-generated artwork',
    description: 'Turn a creative prompt into a cohesive NFT collection.',
  },
  {
    icon: Layers3,
    title: 'Layered collections',
    description: 'Generate compatible traits, rarity levels, and compositions.',
  },
  {
    icon: Sparkles,
    title: 'Launch-ready assets',
    description: 'Prepare images and metadata for an onchain collection.',
  },
];

export default function AIGeneratorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="relative flex flex-1 items-center overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-crown/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-royal-500/10 blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
        </div>

        <section className="container relative mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-crown/30 bg-crown/10 px-4 py-2 text-sm font-medium text-crown">
            <Clock3 className="h-4 w-4" />
            Coming soon
          </div>

          <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-3xl border border-crown/30 bg-gradient-to-br from-royal-500/20 to-gold-500/20 shadow-royal">
            <Wand2 className="h-11 w-11 text-crown" />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI NFT Generator
            <span className="mt-2 block gold-text">is coming soon</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            We are building a faster way to turn an idea into layered artwork,
            collection metadata, and launch-ready NFT assets. The generator is
            temporarily unavailable while we prepare it for release.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 text-left md:grid-cols-3">
            {UPCOMING_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-royal-500/20 bg-card/70 p-5 backdrop-blur-sm"
              >
                <feature.icon className="mb-4 h-6 w-6 text-crown" />
                <h2 className="font-display text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/launchpad">
                Use the Launchpad
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/collections">Explore collections</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            No public release date has been announced yet.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
