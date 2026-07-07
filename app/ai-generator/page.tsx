'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, Plus, Sparkles, Trash2, Wand2, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAIGenerationStore, useWalletStore } from '@/lib/store';
import {
  generateLayeredNFT,
  testEdgeFunctionConnectivity,
  type AIGenerationResponse,
  type AILayerPrompt,
  type GeneratedLayerAsset,
} from '@/lib/ai-layered';
import Link from 'next/link';

const defaultLayerPrompts: AILayerPrompt[] = [
  { id: 'background', name: 'Background', prompt: 'royal palace or luxury cyberpunk environment, no character', traitCount: 1 },
  { id: 'body', name: 'Body', prompt: 'character body, pose, outfit base, transparent background', traitCount: 1 },
  { id: 'face', name: 'Face', prompt: 'face shape and expression, transparent background', traitCount: 1 },
  { id: 'eyes', name: 'Eyes', prompt: 'distinct expressive eyes, transparent background', traitCount: 1 },
  { id: 'mouth', name: 'Mouth', prompt: 'mouth expressions, transparent background', traitCount: 1 },
  { id: 'hair', name: 'Hair', prompt: 'hair styles or head accessories, transparent background', traitCount: 1 },
  { id: 'dress', name: 'Dress', prompt: 'royal clothing, armor, dress or accessories, transparent background', traitCount: 1 },
];

function createLayerPrompt(): AILayerPrompt {
  return {
    id: crypto.randomUUID(),
    name: 'Custom',
    prompt: 'custom trait layer, transparent background',
    traitCount: 1,
  };
}

export default function AIGeneratorPage() {
  const { isConnected } = useWalletStore();
  const setAIDraft = useAIGenerationStore((state) => state.setDraft);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState('100');
  const [mintPrice, setMintPrice] = useState('0.01');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5');
  const [layerPrompts, setLayerPrompts] = useState<AILayerPrompt[]>(defaultLayerPrompts);
  const [generatedLayerAssets, setGeneratedLayerAssets] = useState<Record<string, GeneratedLayerAsset>>({});
  const [generatingLayerId, setGeneratingLayerId] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AIGenerationResponse | null>(null);
  const [error, setError] = useState('');

  const updateLayerPrompt = (id: string, updates: Partial<AILayerPrompt>) => {
    setLayerPrompts((current) =>
      current.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );
  };

  const removeLayerPrompt = (id: string) => {
    setLayerPrompts((current) => current.filter((layer) => layer.id !== id));
    setGeneratedLayerAssets((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const saveDraft = (
    result: AIGenerationResponse,
    generatorLayers = result.generatorLayers || []
  ) => {
    const previewImage = result.imageUrl || generatorLayers[0]?.traits[0]?.preview || '';

    setAIDraft({
      prompt,
      collectionName: collectionName || 'AI Generated Collection',
      collectionSymbol: collectionSymbol || 'AI',
      description,
      maxSupply: parseInt(maxSupply),
      mintPrice,
      royaltyPercentage: parseFloat(royaltyPercentage),
      imageUrl: previewImage,
      metadataUrl: result.metadataUrl || '',
      imageCID: result.imageCID || null,
      metadataCID: result.metadataCID || null,
      layers: result.layers?.length
        ? result.layers
        : previewImage
          ? [{ id: 'preview', url: previewImage, zIndex: 0 }]
          : [],
      generatorLayers: generatorLayers.map((layer) => ({
        ...layer,
        traits: layer.traits.map((trait) => ({
          ...trait,
          file: null,
        })),
      })),
      createdAt: Date.now(),
    });
  };

  const downloadMetadata = () => {
    if (!generatedResult) return;

    const metadata = {
      collectionName,
      collectionSymbol,
      description,
      maxSupply: parseInt(maxSupply),
      mintPrice,
      royaltyPercentage: parseFloat(royaltyPercentage),
      metadataUrl: generatedResult.metadataUrl,
      metadataCID: generatedResult.metadataCID,
      layers: generatedResult.generatorLayers,
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collectionSymbol || 'ai-collection'}-ai-layer-metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        layerPrompts: layerPrompts.filter((layer) => layer.name.trim() && layer.prompt.trim()),
        collectionName,
        collectionSymbol,
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      if (result.success && result.imageUrl && result.metadataUrl) {
        if (result.generatorLayers?.length) {
          setGeneratedLayerAssets(
            Object.fromEntries(result.generatorLayers.map((layer) => [layer.id, layer]))
          );
        }
        saveDraft(result);
        setGeneratedResult(result);
      } else {
        setError(result.error || 'Generation completed without usable image metadata');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLayer = async (layer: AILayerPrompt) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim() || !layer.name.trim() || !layer.prompt.trim()) {
      setError('Add a main prompt and fill in this layer before generating.');
      return;
    }

    setGeneratingLayerId(layer.id);
    setError('');

    try {
      const result = await generateLayeredNFT({
        prompt,
        layerPrompts: [layer],
        collectionName: collectionName || 'AI Generated Collection',
        collectionSymbol: collectionSymbol || 'AI',
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      const generatedLayer = result.generatorLayers?.[0];

      if (result.success && generatedLayer) {
        const nextGeneratedLayers = {
          ...generatedLayerAssets,
          [generatedLayer.id]: generatedLayer,
        };
        const orderedGeneratedLayers = layerPrompts
          .map((layerPrompt) => nextGeneratedLayers[layerPrompt.id])
          .filter((generatedLayer): generatedLayer is GeneratedLayerAsset => Boolean(generatedLayer));

        setGeneratedLayerAssets(nextGeneratedLayers);
        saveDraft(result, orderedGeneratedLayers);
        setGeneratedResult({
          ...result,
          generatorLayers: orderedGeneratedLayers,
        });
      } else {
        setError(result.error || `Could not generate ${layer.name}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGeneratingLayerId(null);
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
                  <CardDescription>
                    Generate collection-ready trait layers, pin metadata, then send them into the launchpad.
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Collection Layers</Label>
                        <p className="text-xs text-muted-foreground">
                          Each row becomes a launchpad layer with AI-generated trait variants.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLayerPrompts((current) => [...current, createLayerPrompt()])}
                        className="royal-border"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {layerPrompts.map((layer) => (
                        <div
                          key={layer.id}
                          className="rounded-lg border border-royal-500/30 p-3 space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_82px_112px_40px] gap-2">
                            <Input
                              value={layer.name}
                              onChange={(event) => updateLayerPrompt(layer.id, { name: event.target.value })}
                              placeholder="Layer"
                              className="royal-border"
                            />
                            <Input
                              value={layer.prompt}
                              onChange={(event) => updateLayerPrompt(layer.id, { prompt: event.target.value })}
                              placeholder="What should this layer generate?"
                              className="royal-border"
                            />
                            <Input
                              type="number"
                              min={1}
                              max={8}
                              value={layer.traitCount}
                              onChange={(event) =>
                                updateLayerPrompt(layer.id, {
                                  traitCount: Math.max(1, Math.min(8, parseInt(event.target.value) || 1)),
                                })
                              }
                              className="royal-border"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleGenerateLayer(layer)}
                              disabled={isGenerating || generatingLayerId !== null}
                              className="royal-border"
                            >
                              {generatingLayerId === layer.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Generate
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLayerPrompt(layer.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {generatedLayerAssets[layer.id]?.traits.length ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {generatedLayerAssets[layer.id].traits.map((trait) => (
                                <div
                                  key={trait.id}
                                  className="overflow-hidden rounded-md border border-royal-500/30 bg-royal-500/10"
                                >
                                  <div className="aspect-square bg-black/20">
                                    <img
                                      src={trait.preview}
                                      alt={trait.name}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                  <div className="truncate px-2 py-1 text-xs text-muted-foreground">
                                    {trait.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
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
                          Generating Layers...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Collection Layers
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
                        Your AI collection layers have been generated and uploaded to IPFS
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
                        {generatedResult.generatorLayers?.length ? (
                          <div>
                            <span className="text-muted-foreground">Generated Layers:</span>
                            <p className="font-mono text-xs break-all text-amber-400">
                              {generatedResult.generatorLayers
                                .map((layer) => `${layer.name} (${layer.traits.length})`)
                                .join(', ')}
                            </p>
                          </div>
                        ) : null}

                        <div>
                          <span className="text-muted-foreground">Metadata CID:</span>
                          <p className="font-mono text-xs break-all text-amber-400">
                            {generatedResult.metadataCID || generatedResult.metadataUrl}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadMetadata}
                          className="royal-border"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Metadata
                        </Button>
                        <Button
                          asChild
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Link href="/launchpad">
                            Use in Launchpad
                          </Link>
                        </Button>
                      </div>
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
