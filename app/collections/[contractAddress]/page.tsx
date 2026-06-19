'use client';

import React, { useState, use } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, isBaseNetwork } from '@/lib/store';
import Link from 'next/link';

interface MintPageProps {
  params: Promise<{ contractAddress: string }>;
}

interface CollectionDetails {
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  maxSupply: number;
  minted: number;
  mintPrice: string;
  creator: string;
  createdAt: string;
  isVerified: boolean;
  openseanUrl: string;
}

// Mock collection data - will be replaced with real contract data
const MOCK_COLLECTION: CollectionDetails = {
  contractAddress: '0x1234567890123456789012345678901234567890',
  name: 'Cyber Royals',
  symbol: 'CR',
  description: 'A unique collection of 10,000 generative cyberpunk-themed NFTs combining royal aesthetics with futuristic elements.',
  coverImage: 'https://images.unsplash.com/photo-1578962996442-48f60103fc96?w=800&h=500&fit=crop',
  bannerImage: 'https://images.unsplash.com/photo-1578962996442-48f60103fc96?w=1400&h=400&fit=crop',
  maxSupply: 10000,
  minted: 2543,
  mintPrice: '0.05',
  creator: 'Creator Name',
  createdAt: '2024-01-15',
  isVerified: true,
  openseanUrl: 'https://opensea.io/collection/cyber-royals',
};

export default function CollectionMintPage({ params }: MintPageProps) {
  const { contractAddress } = use(params);
  const { isConnected, address, chainId } = useWalletStore();
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isCorrectNetwork = isBaseNetwork(chainId);
  const collection = MOCK_COLLECTION; // Replace with real data fetching

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMint = async () => {
    if (!isConnected || !isCorrectNetwork) return;

    setIsMinting(true);
    setMintStatus('pending');
    setMintError(null);

    try {
      // TODO: Implement actual minting logic with contract interaction
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMintTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      setMintStatus('success');
    } catch (error: any) {
      setMintError(error.message || 'Minting failed. Please try again.');
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  const getRemainingSupply = () => collection.maxSupply - collection.minted;
  const getProgressPercent = () => (collection.minted / collection.maxSupply) * 100;
  const getTotalCost = () => (parseFloat(collection.mintPrice) * mintQuantity).toFixed(4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container px-4 max-w-6xl mx-auto">
          {/* Back Link */}
          <Link href="/collections" className="text-crown hover:text-gold-400 transition-colors mb-6 inline-flex items-center gap-1">
            ← Back to Collections
          </Link>

          {/* Banner Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-48 md:h-72 rounded-2xl overflow-hidden mb-8 bg-royal-950/50"
          >
            <img
              src={collection.bannerImage}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Collection Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-start gap-4 mb-6">
                  {/* Collection Logo/Cover */}
                  <div className="relative -mt-20 z-10">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-background bg-card overflow-hidden shadow-royal">
                      <img
                        src={collection.coverImage}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="font-display text-3xl md:text-4xl font-bold">{collection.name}</h1>
                      {collection.isVerified && (
                        <div className="relative group">
                          <Shield className="h-6 w-6 text-green-500" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Verified Collection
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{collection.symbol} Collection</p>
                    <p className="text-sm text-muted-foreground">
                      Created by {collection.creator}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <Card className="royal-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-crown" />
                      About Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {collection.description}
                    </p>

                    {/* Collection Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                        <p className="font-semibold text-gold-400">
                          {collection.maxSupply.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Minted</p>
                        <p className="font-semibold text-gold-400">
                          {collection.minted.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                        <p className="font-semibold text-gold-400">
                          {getRemainingSupply().toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Minting Progress</span>
                        <span className="text-sm font-medium">{getProgressPercent().toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-royal-500/20 rounded-full overflow-hidden border border-royal-500/30">
                        <div
                          className="h-full bg-gradient-to-r from-crown to-gold-400"
                          style={{ width: `${getProgressPercent()}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  className="royal-border flex-1"
                  asChild
                >
                  <a
                    href={collection.openseanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on OpenSea
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="royal-border"
                  onClick={() => handleCopy(collection.contractAddress)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>

              {/* Contract Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-lg bg-royal-500/10 border border-royal-500/20"
              >
                <p className="text-xs text-muted-foreground mb-2">Contract Address</p>
                <p className="font-mono text-sm break-all">{collection.contractAddress}</p>
              </motion.div>
            </div>

            {/* Right Column - Mint Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="royal-card-gold sticky top-24 space-y-6">
                <CardHeader>
                  <CardTitle>Mint NFT</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Mint Price */}
                  <div className="p-4 rounded-lg bg-royal-500/10 border border-royal-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Mint Price</p>
                    <p className="text-3xl font-bold gold-text">{collection.mintPrice} ETH</p>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-3 block">
                      Quantity to Mint
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="royal-border"
                        onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                        disabled={mintQuantity <= 1 || isMinting}
                      >
                        −
                      </Button>
                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={mintQuantity}
                          onChange={(e) =>
                            setMintQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))
                          }
                          className="w-full text-center text-2xl font-bold bg-transparent border-b border-crown outline-none"
                          disabled={isMinting}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="royal-border"
                        onClick={() => setMintQuantity(Math.min(10, mintQuantity + 1))}
                        disabled={mintQuantity >= 10 || isMinting}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Max 10 per transaction
                    </p>
                  </div>

                  {/* Total Cost */}
                  <div className="p-3 rounded-lg bg-royal-500/5 border border-royal-500/10">
                    <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-gold-400">{getTotalCost()} ETH</p>
                  </div>

                  {/* Network Warning */}
                  {isConnected && !isCorrectNetwork && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive font-medium">
                        Wrong Network - Switch to Base to mint
                      </p>
                    </div>
                  )}

                  {/* Connection Status */}
                  {!isConnected && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-300">
                        Connect your wallet to mint
                      </p>
                    </div>
                  )}

                  {/* Mint Button */}
                  <Button
                    onClick={handleMint}
                    disabled={!isConnected || !isCorrectNetwork || isMinting || mintStatus === 'success'}
                    className="w-full gold-button h-12 text-base"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Minting...
                      </>
                    ) : mintStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Minted Successfully!
                      </>
                    ) : (
                      'Mint Now'
                    )}
                  </Button>

                  {/* Error Message */}
                  {mintStatus === 'error' && mintError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive">{mintError}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full royal-border"
                        onClick={() => setMintStatus('idle')}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Success Message */}
                  {mintStatus === 'success' && mintTxHash && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-green-500 mb-1">Mint Successful!</p>
                          <p className="text-xs text-muted-foreground">
                            Transaction: {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sold Out Notice */}
                  {getRemainingSupply() === 0 && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                      <p className="font-semibold text-red-500">Collection Sold Out</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All NFTs have been minted. Check OpenSea for secondary market.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
