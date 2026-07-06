'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Loader2, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore } from '@/lib/store';
import { generateLayeredNFT, testEdgeFunctionConnectivity } from '@/lib/ai-layered';
import Link from 'next/link';

export default function AIGeneratorPage() {
  const { isConnected, address } = useWalletStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState('100');
  const [mintPrice, setMintPrice] = useState('0.01');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTestConnection = async () => {
    setError('');
    setError('Testing connection...');
    const result = await testEdgeFunctionConnectivity();
    if (result.success) {
      setError('Connection successful! You can now generate.');
    } else {
      setError(`Connection failed: ${result.error}`);
    }
  };

  const handleGenerate = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim() || !collectionName.trim() || !collectionSymbol.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await generateLayeredNFT({
        prompt,
        collectionName,
        collectionSymbol,
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      if (result.success) {
        setGeneratedResult(result);
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 md:gap-3">
              <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-crown" />
              AI Layered NFT Generator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Create stunning layered NFTs using AI with parallax effects
            </p>
          </motion.div>

          {!isConnected ? (
            <Card className="royal-card text-center py-12 md:py-16">
              <CardContent>
                <Crown className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="font-display text-lg md:text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
                  Connect your wallet to start generating AI-powered layered NFTs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Generator Form */}
              <Card className="royal-card mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-crown" />
                    Create Your AI Layered NFT
                  </CardTitle>
                  <CardDescription>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">AI Prompt *</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A majestic dragon with golden scales flying over a crystal castle at sunset, digital art style..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="royal-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collectionName">Collection Name *</Label>
                      <Input
                        id="collectionName"
                        placeholder="My Dragon Collection"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collectionSymbol">Symbol *</Label>
                      <Input
                        id="collectionSymbol"
                        placeholder="DRGN"
                        value={collectionSymbol}
                        onChange={(e) => setCollectionSymbol(e.target.value)}
                        className="royal-border uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your collection..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="royal-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSupply">Max Supply</Label>
                      <Input
                        id="maxSupply"
                        type="number"
                        value={maxSupply}
                        onChange={(e) => setMaxSupply(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                      <Input
                        id="mintPrice"
                        type="text"
                        value={mintPrice}
                        onChange={(e) => setMintPrice(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="royaltyPercentage">Royalty (%)</Label>
                      <Input
                        id="royaltyPercentage"
                        type="number"
                        value={royaltyPercentage}
                        onChange={(e) => setRoyaltyPercentage(e.target.value)}
                        className="royal-border"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestConnection}
                      disabled={isGenerating}
                      variant="outline"
                      className="flex-1 royal-border"
                    >
                      Test Connection
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating AI Art...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Layered NFT
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Result */}
              {generatedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="royal-card">
                    <CardHeader>
                      <CardTitle className="text-green-400">✓ Generation Complete!</CardTitle>
                      <CardDescription>
                        Your AI layered NFT has been generated and uploaded to IPFS
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {generatedResult.imageUrl && (
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-royal-500/10">
                          <img
                            src={generatedResult.imageUrl}
                            alt="Generated NFT"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Metadata CID:</span>
                          <p className="font-mono text-xs break-all text-amber-400">
                            {generatedResult.metadataCID}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <Link href="/ai-mint">
                          Proceed to Mint
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
