'use client';

import React, { useState, use } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Crown,
  Wallet,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, isBaseNetwork } from '@/lib/store';

interface MintPageProps {
  params: Promise<{ contractAddress: string }>;
}

export default function MintPage({ params }: MintPageProps) {
  const { contractAddress } = use(params);
  const { isConnected, chainId, address } = useWalletStore();
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);

  const isCorrectNetwork = isBaseNetwork(chainId);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleMint = async () => {
    if (!isConnected || !isCorrectNetwork) return;
    setIsMinting(true);

    try {
      if (!window.ethereum) {
        throw new Error('Web3 wallet not found');
      }

      // Import viem for encoding
      const { encodeFunctionData, parseEther } = await import('viem');
      const { ROYAL_NFT_ABI } = await import('@/lib/contracts/contract-source');

      // Get mint price from contract (default to 0.05 ETH)
      const mintPriceWei = parseEther('0.05');
      const totalValue = mintPriceWei * BigInt(mintQuantity);

      // Encode mint function call
      const data = encodeFunctionData({
        abi: ROYAL_NFT_ABI,
        functionName: 'mint',
        args: [BigInt(mintQuantity), '0x0000000000000000000000000000000000000000'], // No referral
      });

      // Prepare mint transaction
      const txParams = {
        from: address,
        to: contractAddress as `0x${string}`,
        data: data,
        value: '0x' + totalValue.toString(16),
      };

      // Send transaction
      const txHash = await (window.ethereum as any).request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      // Wait for confirmation
      const maxWaitTime = 5 * 60 * 1000;
      const pollInterval = 3 * 1000;
      const startTime = Date.now();
      let receipt = null;

      while (!receipt && Date.now() - startTime < maxWaitTime) {
        try {
          const result = await (window.ethereum as any).request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });

          if (result) {
            receipt = result;
          }
        } catch (e) {
          // Ignore polling errors
        }

        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      if (!receipt) {
        throw new Error('Transaction confirmation timeout');
      }

      if (receipt.status === '0x0') {
        throw new Error('Transaction failed');
      }

      // Success
      alert(`Successfully minted ${mintQuantity} NFT(s)!`);
    } catch (error: any) {
      console.error('Mint failed:', error);
      alert(error.message || 'Mint failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 max-w-6xl">
          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-36 sm:h-44 md:h-56 lg:h-64 rounded-xl sm:rounded-2xl overflow-hidden mb-4 md:mb-6 bg-gradient-to-br from-royal-500/20 to-gold-500/20"
          >
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Crown className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 opacity-30" />
            </div>
          </motion.div>

          {/* Collection Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8"
          >
            {/* Logo */}
            <div className="relative -mt-16 sm:-mt-18 md:-mt-16 ml-2 sm:ml-4 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl border-4 border-background bg-card flex items-center justify-center">
                <Crown className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground opacity-50" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                  Collection
                </h1>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gold-500 opacity-50" />
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-1 sm:mb-2 break-all">
                Contract: {contractAddress}
              </p>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Preview */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* NFT Preview */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-crown" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-xl bg-royal-950/50 flex items-center justify-center">
                    <Crown className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground opacity-30" />
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Collection description will appear here once loaded.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Mint */}
            <div className="space-y-4 md:space-y-6">
              {/* Mint Card */}
              <Card className="royal-card-gold sticky top-20 md:top-24">
                <CardContent className="pt-4 md:pt-6 space-y-4 md:space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold gold-text">0</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Minted</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold gold-text">0</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Remaining</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold gold-text">0</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">ETH Each</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">0%</span>
                    </div>
                    <div className="royal-progress">
                      <div className="royal-progress-bar" style={{ width: '0%' }} />
                    </div>
                  </div>

                  {/* Network Warning */}
                  {isConnected && !isCorrectNetwork && (
                    <div className="p-2 sm:p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs sm:text-sm">
                      <p className="font-medium text-destructive mb-1">Wrong Network</p>
                      <p className="text-muted-foreground">
                        Please switch to Base to mint
                      </p>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Quantity</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                        disabled={mintQuantity <= 1}
                        className="royal-border"
                      >
                        -
                      </Button>
                      <div className="flex-1 text-center text-2xl font-bold">
                        {mintQuantity}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMintQuantity(Math.min(10, mintQuantity + 1))}
                        disabled={mintQuantity >= 10}
                        className="royal-border"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-royal-500/20" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold gold-text">{mintQuantity * 0} ETH</span>
                  </div>

                  {/* Mint Button */}
                  {!isConnected ? (
                    <Button className="w-full gold-button h-14">
                      <Wallet className="mr-2 h-5 w-5" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <Button
                      onClick={handleMint}
                      disabled={isMinting || !isCorrectNetwork}
                      className="w-full gold-button h-14"
                    >
                      {isMinting ? (
                        'Minting...'
                      ) : (
                        <>
                          <Crown className="mr-2 h-5 w-5" />
                          Mint {mintQuantity}
                        </>
                      )}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Plus gas fees (~$0.01 on Base)
                  </p>
                </CardContent>
              </Card>

              {/* Share & QR */}
              <Card className="royal-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-crown" />
                      Share
                    </h3>
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="outline" size="sm" className="royal-border">
                          QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="royal-card text-center">
                        <DialogHeader>
                          <DialogTitle>Share Collection</DialogTitle>
                          <DialogDescription>
                            Scan to mint directly
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-4">
                          <QRCodeSVG
                            value={shareUrl}
                            size={200}
                            bgColor="#1a0a2e"
                            fgColor="#ffd700"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
