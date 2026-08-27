'use client';

/* eslint-disable @next/next/no-img-element -- local SVG data URIs are not supported by next/image optimization. */

import { useMemo, useState } from 'react';
import { CheckCircle2, Crown, ImageIcon, Layers3, LockKeyhole, ReceiptText, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const STYLE_OPTIONS = [
  { value: 'royal-futurism', label: 'Royal futurism', palette: ['#1a0a2e', '#6E44FF', '#ffd700'] },
  { value: 'celestial-gold', label: 'Celestial gold', palette: ['#100d2c', '#382c72', '#f6c453'] },
  { value: 'mythic-portrait', label: 'Mythic portrait', palette: ['#22112a', '#7b2959', '#f0bb55'] },
  { value: 'neo-heritage', label: 'Neo heritage', palette: ['#081d2d', '#176d7d', '#eac06a'] },
];

const STARTER_PROMPTS = [
  'A sovereign tiger in ceremonial gold armor',
  'A celestial empress made of starlight and molten gold',
  'An ancient palace guardian with luminous gemstones',
];

const PRODUCTION_MODES = {
  single: {
    label: '1-of-1 NFT',
    price: '0.015 ETH',
    detail: 'One final AI artwork, IPFS metadata, and one mint-ready NFT.',
  },
  collection: {
    label: 'Generative collection',
    price: 'from 0.05 ETH',
    detail: 'Batch final artwork, metadata set, collection cover, banner, and rarity structure.',
  },
} as const;

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character));
}

function wrapText(text: string, maxLength = 25) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function createLocalDraft(prompt: string, palette: string[]) {
  const [dark, mid, gold] = palette;
  const lines = wrapText(prompt).map((line, index) => `<text x="50%" y="${404 + index * 30}" fill="#fff9df" font-family="Georgia, serif" font-size="20" text-anchor="middle">${escapeXml(line)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="#090510"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${gold}" stop-opacity=".75"/><stop offset="1" stop-color="${gold}" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <circle cx="512" cy="390" r="300" fill="url(#glow)" opacity=".45" filter="url(#blur)"/>
    <path d="M512 140 760 290v280L512 760 264 570V290Z" fill="none" stroke="${gold}" stroke-width="4" opacity=".8"/>
    <path d="M512 200 700 315v220L512 650 324 535V315Z" fill="none" stroke="#fff2bd" stroke-width="1.5" opacity=".7"/>
    <circle cx="512" cy="390" r="112" fill="${dark}" stroke="${gold}" stroke-width="5"/>
    <path d="M455 412c24-86 92-86 116 0 6 23-3 49-21 63l-38 31-38-31c-18-14-25-40-19-63Z" fill="${gold}" opacity=".9"/>
    <text x="50%" y="112" fill="${gold}" font-family="Georgia, serif" font-size="26" font-weight="bold" letter-spacing="7" text-anchor="middle">HOUSE OF JOSHI</text>
    <text x="50%" y="860" fill="#fff2bd" font-family="Arial, sans-serif" font-size="15" letter-spacing="4" text-anchor="middle">CONCEPT WIRE FRAME · NOT FINAL ART</text>
    ${lines}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function AIPreviewBuilder() {
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0]);
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);
  const [productionMode, setProductionMode] = useState<keyof typeof PRODUCTION_MODES>('single');
  const [collectionSize, setCollectionSize] = useState(25);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedStyle = useMemo(() => STYLE_OPTIONS.find((option) => option.value === style) || STYLE_OPTIONS[0], [style]);
  const estimatedCollectionPrice = productionMode === 'collection' ? (0.05 + Math.max(0, collectionSize - 25) * 0.0012).toFixed(3) : null;

  const handlePreview = () => {
    const concept = prompt.trim();
    if (concept.length < 3) {
      setError('Describe the artwork you want to explore in at least 3 characters.');
      return;
    }
    setError(null);
    setPreviewImage(createLocalDraft(concept, selectedStyle.palette));
  };

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-8">
      <Card className="royal-card border-royal-500/30 shadow-royal">
        <CardHeader className="border-b border-royal-500/15"><CardTitle className="flex items-center gap-2 font-display text-2xl"><Wand2 className="h-5 w-5 text-crown" />Shape a concept</CardTitle><CardDescription>Create a local visual wireframe. No wallet, cloud request, payment, or AI image generation is used.</CardDescription></CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2"><Label htmlFor="ai-prompt">Your creative direction</Label><Textarea id="ai-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={800} className="min-h-36 resize-y border-royal-500/25 bg-royal-950/20 leading-6" placeholder="Describe the NFT artwork you want to explore..." /><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Use this to plan subject, mood, materials, and setting.</span><span>{prompt.length}/800</span></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>House style</Label><Select value={style} onValueChange={setStyle}><SelectTrigger className="border-royal-500/25 bg-royal-950/20"><SelectValue /></SelectTrigger><SelectContent>{STYLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border border-royal-500/20 bg-royal-500/5 px-4 py-3"><p className="text-xs text-muted-foreground">Cost</p><p className="mt-1 flex items-center gap-2 font-semibold text-crown"><Sparkles className="h-4 w-4" />Always free locally</p></div></div>
          <div className="flex flex-wrap gap-2">{STARTER_PROMPTS.map((starter) => <Button key={starter} variant="outline" size="sm" className="h-auto whitespace-normal border-royal-500/20 text-left text-xs text-muted-foreground hover:border-crown/40 hover:text-crown" onClick={() => setPrompt(starter)}>{starter}</Button>)}</div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          <Button className="gold-button h-12 w-full" onClick={handlePreview}><Sparkles className="mr-2 h-5 w-5" />Preview layout — free</Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">This is a concept wireframe generated in your browser. Final AI artwork is created only after paid production is implemented and confirmed.</p>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card className="royal-card overflow-hidden"><CardHeader className="border-b border-royal-500/15"><CardTitle className="flex items-center gap-2 font-display text-xl"><ImageIcon className="h-5 w-5 text-crown" />Your local concept</CardTitle></CardHeader><CardContent className="p-4 sm:p-6">{previewImage ? <div className="overflow-hidden rounded-xl border border-crown/25 bg-royal-950/40"><img src={previewImage} alt="House of Joshi NFT concept wireframe" className="aspect-square w-full object-cover" /></div> : <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-royal-500/30 bg-gradient-to-br from-royal-500/10 to-gold-500/10 p-8 text-center"><div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-crown/25 bg-crown/10"><Crown className="h-8 w-8 text-crown" /></div><h2 className="font-display text-xl font-semibold">Your vision appears here</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Write a concept and create a zero-cost local wireframe.</p></div></div>}</CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2"><Card className="royal-card border-royal-500/20"><CardContent className="p-5"><CheckCircle2 className="mb-3 h-5 w-5 text-crown" /><h2 className="font-display text-lg font-semibold">Produce a 1-of-1</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Paid generation, permanent IPFS storage, and Dreamweaver minting will happen only after confirmed payment.</p><p className="mt-4 text-xs font-medium text-crown">Paid production below</p></CardContent></Card><Card className="royal-card border-royal-500/20"><CardContent className="p-5"><Layers3 className="mb-3 h-5 w-5 text-crown" /><h2 className="font-display text-lg font-semibold">Build a collection</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Paid production will create traits, rarity, metadata, and launch assets after payment confirmation.</p><p className="mt-4 text-xs font-medium text-crown">Paid production below</p></CardContent></Card></div>
      </div>
      </div>

      <Card className="royal-card-gold overflow-hidden border-crown/30">
        <CardHeader className="border-b border-crown/20">
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <ReceiptText className="h-5 w-5 text-crown" />
            Paid production
          </CardTitle>
          <CardDescription>Final AI art, IPFS storage, and mint-ready metadata only start after payment is confirmed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(PRODUCTION_MODES).map(([mode, option]) => {
                const isActive = productionMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setProductionMode(mode as keyof typeof PRODUCTION_MODES)}
                    className={`rounded-lg border p-4 text-left transition ${isActive ? 'border-crown bg-crown/15 shadow-royal' : 'border-royal-500/20 bg-royal-950/20 hover:border-crown/50'}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-lg font-semibold">{option.label}</span>
                      {mode === 'single' ? <ImageIcon className="h-5 w-5 text-crown" /> : <Layers3 className="h-5 w-5 text-crown" />}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-crown">{mode === 'collection' && estimatedCollectionPrice ? `${estimatedCollectionPrice} ETH est.` : option.price}</span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">{option.detail}</span>
                  </button>
                );
              })}
            </div>

            {productionMode === 'collection' && (
              <div className="rounded-lg border border-royal-500/20 bg-royal-950/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <Label htmlFor="collection-size">Collection size</Label>
                  <span className="text-sm font-semibold text-crown">{collectionSize} NFTs</span>
                </div>
                <Slider id="collection-size" min={10} max={100} step={5} value={[collectionSize]} onValueChange={(value) => setCollectionSize(value[0] || 25)} />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>10</span><span>100</span></div>
              </div>
            )}

            <Button disabled className="gold-button h-12 w-full disabled:cursor-not-allowed disabled:opacity-70">
              <LockKeyhole className="mr-2 h-5 w-5" />
              Connect payment contract next
            </Button>
            <p className="text-center text-xs leading-5 text-muted-foreground">This button stays locked until we add transaction verification. That keeps unpaid users from triggering paid cloud generation.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border border-royal-500/20 bg-royal-950/20 p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-crown" />
              <h3 className="font-display text-base font-semibold">1. Verify payment</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Backend checks the Base transaction hash, recipient, amount, wallet, and whether it was already used.</p>
            </div>
            <div className="rounded-lg border border-royal-500/20 bg-royal-950/20 p-4">
              <Sparkles className="mb-3 h-5 w-5 text-crown" />
              <h3 className="font-display text-base font-semibold">2. Generate final art</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Vertex AI runs only after the payment check passes, using the approved prompt and House style.</p>
            </div>
            <div className="rounded-lg border border-royal-500/20 bg-royal-950/20 p-4">
              <CheckCircle2 className="mb-3 h-5 w-5 text-crown" />
              <h3 className="font-display text-base font-semibold">3. Pin and mint</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Final image, metadata, cover, and banner go to IPFS, then the NFT or collection becomes ready to mint.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
