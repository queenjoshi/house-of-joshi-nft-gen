'use client';

/* eslint-disable @next/next/no-img-element -- Vertex preview is returned as a temporary data URL. */

import { useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Crown, ImageIcon, Layers3, Loader2, LockKeyhole, Sparkles, Wand2 } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPreviewAuthorizationMessage } from '@/lib/ai/preview-auth';

const STYLE_OPTIONS = [
  { value: 'royal-futurism', label: 'Royal futurism' },
  { value: 'celestial-gold', label: 'Celestial gold' },
  { value: 'mythic-portrait', label: 'Mythic portrait' },
  { value: 'neo-heritage', label: 'Neo heritage' },
];

const STARTER_PROMPTS = [
  'A sovereign tiger in ceremonial gold armor, violet nebula background, intricate engraved details',
  'A celestial empress made of starlight and molten gold, royal portrait, deep indigo backdrop',
  'An ancient palace guardian with luminous gemstones, sculptural NFT art, dark royal atmosphere',
];

type PreviewResponse = {
  success?: boolean;
  previewImage?: string;
  remainingPreviews?: number;
  error?: string;
};

export default function AIGeneratorPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0]);
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [remainingPreviews, setRemainingPreviews] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStyle = useMemo(
    () => STYLE_OPTIONS.find((option) => option.value === style)?.label || 'Royal futurism',
    [style],
  );

  const handleGenerate = async () => {
    if (!address || !isConnected) return;
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 3) {
      setError('Describe the artwork you want to create in at least 3 characters.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const nonce = crypto.randomUUID();
      const issuedAt = new Date().toISOString();
      const styledPrompt = `${trimmedPrompt}. Visual direction: ${selectedStyle}. House of Joshi luxury NFT aesthetic.`;
      const message = createPreviewAuthorizationMessage({ walletAddress: address, prompt: styledPrompt, nonce, issuedAt });
      const signature = await signMessageAsync({ message });
      const response = await fetch('/api/ai/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: styledPrompt, walletAddress: address, nonce, issuedAt, signature }),
      });
      const data = await response.json() as PreviewResponse;
      if (!response.ok || !data.success || !data.previewImage) throw new Error(data.error || 'Could not generate your preview.');
      setPreviewImage(data.previewImage);
      setRemainingPreviews(typeof data.remainingPreviews === 'number' ? data.remainingPreviews : null);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Could not generate your preview.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="relative flex-1 overflow-hidden py-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-crown/10 blur-3xl" />
          <div className="absolute bottom-0 right-[-10rem] h-80 w-80 rounded-full bg-royal-500/10 blur-3xl" />
        </div>
        <section className="container relative mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-crown/30 bg-crown/10 px-4 py-2 text-sm font-medium text-crown"><Sparkles className="h-4 w-4" />Vertex AI preview studio</div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Dream it in <span className="gold-text">royal detail.</span></h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Explore your collection&apos;s visual world before you produce it. Every wallet receives up to 10 free signed previews per day.</p>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-8">
            <Card className="royal-card border-royal-500/30 shadow-royal">
              <CardHeader className="border-b border-royal-500/15"><CardTitle className="flex items-center gap-2 font-display text-2xl"><Wand2 className="h-5 w-5 text-crown" />Create a preview</CardTitle><CardDescription>Describe one artwork. You will sign a free authorization—never a transaction.</CardDescription></CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2"><Label htmlFor="ai-prompt">Your creative direction</Label><Textarea id="ai-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={800} className="min-h-36 resize-y border-royal-500/25 bg-royal-950/20 leading-6" placeholder="Describe the NFT artwork you want to explore..." /><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Be specific about subject, mood, materials, and setting.</span><span>{prompt.length}/800</span></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>House style</Label><Select value={style} onValueChange={setStyle}><SelectTrigger className="border-royal-500/25 bg-royal-950/20"><SelectValue /></SelectTrigger><SelectContent>{STYLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="rounded-lg border border-royal-500/20 bg-royal-500/5 px-4 py-3"><p className="text-xs text-muted-foreground">Preview allowance</p><p className="mt-1 flex items-center gap-2 font-semibold text-crown"><LockKeyhole className="h-4 w-4" />{remainingPreviews === null ? '10 daily previews' : `${remainingPreviews} remaining today`}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">{STARTER_PROMPTS.map((starter) => <Button key={starter} variant="outline" size="sm" className="h-auto whitespace-normal border-royal-500/20 text-left text-xs text-muted-foreground hover:border-crown/40 hover:text-crown" onClick={() => setPrompt(starter)}>{starter.split(',')[0]}</Button>)}</div>
                {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
                {!isConnected ? <ConnectButton.Custom>{({ openConnectModal }) => <Button className="gold-button h-12 w-full" onClick={openConnectModal}><Crown className="mr-2 h-5 w-5" />Connect wallet to start</Button>}</ConnectButton.Custom> : <Button className="gold-button h-12 w-full" disabled={isGenerating} onClick={handleGenerate}>{isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating your preview...</> : <><Sparkles className="mr-2 h-5 w-5" />Generate free preview</>}</Button>}
                <p className="text-center text-xs leading-5 text-muted-foreground">You sign only to protect your free allowance. No gas, payment, or NFT mint occurs in this step.</p>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="royal-card overflow-hidden"><CardHeader className="border-b border-royal-500/15"><CardTitle className="flex items-center gap-2 font-display text-xl"><ImageIcon className="h-5 w-5 text-crown" />Your preview</CardTitle></CardHeader><CardContent className="p-4 sm:p-6"><AnimatePresence mode="wait">{previewImage ? <motion.div key="image" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-xl border border-crown/25 bg-royal-950/40"><img src={previewImage} alt="AI-generated House of Joshi NFT preview" className="aspect-square w-full object-cover" /></motion.div> : <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid aspect-square place-items-center rounded-xl border border-dashed border-royal-500/30 bg-gradient-to-br from-royal-500/10 to-gold-500/10 p-8 text-center"><div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-crown/25 bg-crown/10"><Crown className="h-8 w-8 text-crown" /></div><h2 className="font-display text-xl font-semibold">Your vision appears here</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Connect a wallet, describe your idea, and create a secure free preview.</p></div></motion.div>}</AnimatePresence></CardContent></Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="royal-card border-royal-500/20"><CardContent className="p-5"><CheckCircle2 className="mb-3 h-5 w-5 text-crown" /><h2 className="font-display text-lg font-semibold">Produce a 1-of-1</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Pin your selected artwork and prepare it for a Dreamweaver mint.</p><p className="mt-4 text-xs font-medium text-crown">Available after preview</p></CardContent></Card>
                <Card className="royal-card border-royal-500/20"><CardContent className="p-5"><Layers3 className="mb-3 h-5 w-5 text-crown" /><h2 className="font-display text-lg font-semibold">Build a collection</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Turn a chosen visual direction into traits, rarity, metadata, and launch assets.</p><p className="mt-4 text-xs font-medium text-crown">Collection production next</p></CardContent></Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
