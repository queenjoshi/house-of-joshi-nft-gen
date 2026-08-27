import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AIPreviewBuilder } from '@/components/ai-preview-builder';

export const metadata: Metadata = {
  title: 'AI NFT Concept Studio | House of Joshi',
  description: 'Build a free local NFT concept wireframe before paid production.',
};

export default function AIGeneratorPage() {
  return <div className="flex min-h-screen flex-col bg-background"><Header /><main className="relative flex-1 overflow-hidden py-8 sm:py-12"><div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-crown/10 blur-3xl" /><div className="absolute bottom-0 right-[-10rem] h-80 w-80 rounded-full bg-royal-500/10 blur-3xl" /></div><section className="container relative mx-auto max-w-7xl px-4"><div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-crown/30 bg-crown/10 px-4 py-2 text-sm font-medium text-crown"><Sparkles className="h-4 w-4" />Free concept studio</div><h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Dream it in <span className="gold-text">royal detail.</span></h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Explore a visual direction for your collection at zero cloud cost. Only paid production will create final AI art, permanent assets, and mint-ready metadata.</p></div><AIPreviewBuilder /></section></main><Footer /></div>;
}
