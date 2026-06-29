'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Crown, ExternalLink, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { useCollectionsStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type LayoutMode = 'grid' | 'list';

interface CollectionCard {
  id: string;
  contractAddress: string;
  name: string;
  symbol: string;
  coverImage: string | null;
  bannerImage: string | null;
  maxSupply: number;
  minted: number;
  mintPrice: string;
  creator: string;
  isVerified: boolean;
}

export default function CollectionsPage() {
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [collections, setCollections] = useState<CollectionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const deployedCollections = useCollectionsStore((state) => state.getAllCollections());

  // Ensure hydration is complete before rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    console.log('Collections page - deployedCollections:', deployedCollections);
    console.log('Collections page - isHydrated:', isHydrated);

    // Convert deployed collections to display format
    const displayCollections: CollectionCard[] = deployedCollections.map((col) => ({
      id: col.id,
      contractAddress: col.contractAddress,
      name: col.name,
      symbol: col.symbol,
      coverImage: col.coverImage,
      bannerImage: col.bannerImage,
      maxSupply: col.maxSupply,
      minted: 0,
      mintPrice: col.mintPrice,
      creator: col.creatorAddress,
      isVerified: false,
    }));
    
    console.log('Collections page - displayCollections:', displayCollections);
    setCollections(displayCollections);
    setIsLoading(false);
  }, [deployedCollections, isHydrated]);

  const handleDebug = () => {
    const stored = localStorage.getItem('collections-storage');
    const info = `
Collections in localStorage:
${stored ? JSON.stringify(JSON.parse(stored), null, 2) : 'No data found'}

Collections in state:
${JSON.stringify(deployedCollections, null, 2)}

Display collections:
${JSON.stringify(collections, null, 2)}
    `;
    setDebugInfo(info);
    setShowDebug(true);
    console.log(info);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getOpenSeaUrl = (contractAddress: string) => {
    return `https://opensea.io/collection/${contractAddress}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container px-4 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 md:mb-8 lg:mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 md:mb-6"
            >
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 lg:mb-3">
                <span className="block mb-1 md:mb-2">NFT Collections</span>
                <span className="text-amber-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl">Created on House of Joshi</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl">
                Discover and mint from all collections created through the House of Joshi Launchpad.
              </p>
            </motion.div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 md:gap-4 p-3 sm:p-3 md:p-4 rounded-lg bg-royal-500/10 border border-royal-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Layout:</span>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    size="sm"
                    variant={layout === 'grid' ? 'default' : 'outline'}
                    onClick={() => setLayout('grid')}
                    className={cn(
                      "h-8 sm:h-8 px-2 sm:px-2 md:px-3 text-xs sm:text-xs md:text-sm",
                      layout === 'grid' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'royal-border'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={layout === 'list' ? 'default' : 'outline'}
                    onClick={() => setLayout('list')}
                    className={cn(
                      "h-8 sm:h-8 px-2 sm:px-2 md:px-3 text-xs sm:text-xs md:text-sm",
                      layout === 'list' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'royal-border'
                    )}
                  >
                    <List className="h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-1 md:mr-2" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2 md:gap-3 flex-wrap">
                <div className="text-xs sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="royal-border h-8 sm:h-8 px-2 sm:px-2 md:px-3 text-xs sm:text-xs md:text-sm"
                  onClick={handleRefresh}
                  title="Refresh collections"
                >
                  <RotateCcw className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDebug}
                  title="Show debug info"
                  className="h-8 sm:h-8 px-2 sm:px-2 md:px-3 text-xs sm:text-xs md:text-sm"
                >
                  Debug
                </Button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {layout === 'grid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 md:mb-12"
            >
              <AnimatePresence>
                {collections.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-8 md:py-12"
                  >
                    <Crown className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No Collections Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4 md:mb-6 max-w-md mx-auto">
                      Collections will appear here as they are deployed through House of Joshi Launchpad.
                    </p>
                    <Link href="/launchpad">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2">Create Your Collection</Button>
                    </Link>
                  </motion.div>
                ) : (
                  collections.map((collection, index) => (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ translateY: -4 }}
                    >
                      <Link href={`/collections/${collection.contractAddress}`}>
                        <Card className="royal-card cursor-pointer h-full overflow-hidden hover:shadow-royal transition-all duration-300">
                          {/* Banner Image */}
                          {collection.bannerImage && (
                            <div className="relative w-full h-24 sm:h-28 md:h-32 bg-royal-950/50 overflow-hidden">
                              <Image
                                src={collection.bannerImage}
                                alt={`${collection.name} banner`}
                                width={400}
                                height={128}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          {/* Cover Image - 1:1 Aspect Ratio */}
                          <div className="relative w-full aspect-square bg-royal-950/50 overflow-hidden">
                            {collection.coverImage ? (
                              <Image
                                src={collection.coverImage}
                                alt={collection.name}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-royal-500/20 to-amber-500/20">
                                <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 opacity-50" />
                              </div>
                            )}
                            {collection.isVerified && (
                              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                                  ✓ Verified
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                            {/* Collection Name */}
                            <div>
                              <h3 className="font-display text-base sm:text-lg font-bold mb-0.5 sm:mb-1">{collection.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">{collection.symbol}</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <div className="p-2 rounded bg-royal-500/10 border border-royal-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Minted</p>
                                <p className="font-semibold text-amber-400">
                                  {collection.minted.toLocaleString()} / {collection.maxSupply.toLocaleString()}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-royal-500/10 border border-royal-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Mint Price</p>
                                <p className="font-semibold text-amber-400">{collection.mintPrice} ETH</p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="w-full h-2 bg-royal-500/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                  style={{
                                    width: `${(collection.minted / collection.maxSupply) * 100}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((collection.minted / collection.maxSupply) * 100)}% Sold
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Mint
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="royal-border"
                                asChild
                              >
                                <a
                                  href={getOpenSeaUrl(collection.contractAddress)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* List View */}
          {layout === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-12"
            >
              <AnimatePresence>
                {collections.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Collections will appear here as they are deployed through House of Joshi Launchpad.
                    </p>
                    <Link href="/launchpad">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white">Create Your Collection</Button>
                    </Link>
                  </motion.div>
                ) : (
                  collections.map((collection, index) => (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/collections/${collection.contractAddress}`}>
                        <Card className="royal-card cursor-pointer hover:shadow-royal transition-all duration-300">
                          <CardContent className="p-0">
                            {/* Banner Image */}
                            {collection.bannerImage && (
                              <div className="relative w-full h-24 md:h-32 bg-royal-950/50 overflow-hidden">
                                <Image
                                  src={collection.bannerImage}
                                  alt={`${collection.name} banner`}
                                  width={400}
                                  height={128}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            
                            <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                              {/* Cover Image */}
                              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                                {collection.coverImage ? (
                                  <Image
                                    src={collection.coverImage}
                                    alt={collection.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-royal-500/20 to-amber-500/20">
                                    <Crown className="h-6 w-6 text-amber-400 opacity-50" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-display text-lg font-bold">{collection.name}</h3>
                                  {collection.isVerified && (
                                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                      ✓
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {collection.symbol} • {collection.maxSupply.toLocaleString()} Supply
                                </p>

                                {/* Progress */}
                                <div className="w-full h-1.5 bg-royal-500/20 rounded-full overflow-hidden mb-1">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                    style={{
                                      width: `${(collection.minted / collection.maxSupply) * 100}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {collection.minted.toLocaleString()} / {collection.maxSupply.toLocaleString()} minted
                                </p>
                              </div>

                              {/* Stats */}
                              <div className="flex gap-6 text-center min-w-fit">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Mint Price</p>
                                  <p className="font-semibold text-amber-400">{collection.mintPrice} ETH</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Progress</p>
                                  <p className="font-semibold text-amber-400">
                                    {Math.round((collection.minted / collection.maxSupply) * 100)}%
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 w-full md:w-auto">
                                <Button size="sm" className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white">
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  Mint
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="royal-border"
                                  asChild
                                >
                                  <a
                                    href={getOpenSeaUrl(collection.contractAddress)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Debug Modal */}
      {showDebug && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="royal-card w-full max-w-2xl max-h-96 overflow-auto">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Debug Information</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDebug(false)}
                >
                  Close
                </Button>
              </div>
              <pre className="text-xs bg-royal-500/10 p-3 rounded border border-royal-500/20 overflow-auto max-h-80">
                {debugInfo}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
