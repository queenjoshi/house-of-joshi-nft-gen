'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import LayeredNFTViewer from '@/components/layered-nft-viewer';
import { useWalletStore } from '@/lib/store';
import { useCollectionsStore } from '@/lib/store';
import { uploadLayeredMetadataToIPFS } from '@/lib/ai-layered';
import { deployCollection } from '@/lib/contracts/contract-source';

export default function AIMintPage() {
  const { isConnected, address } = useWalletStore();
  const addDeployedCollection = useCollectionsStore((state) => state.addDeployedCollection);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  // Collection details (in a real app, these would come from the generator page)
  const [collectionDetails] = useState({
    name: 'AI Generated Collection',
    symbol: 'AIGEN',
    description: 'AI-generated layered NFT collection',
    maxSupply: 100,
    mintPrice: '0.01',
    royaltyPercentage: 5,
  });

  // Sample layers (in a real app, these would come from the generator result)
  const [layers] = useState([
    { id: 'main', url: 'https://gateway.pinata.cloud/ipfs/QmPlaceholder', zIndex: 0 },
  ]);

  const handleDeploy = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setError('');

    try {
      // Step 1: Upload metadata to IPFS
      const metadata = {
        name: collectionDetails.name,
        description: collectionDetails.description,
        composition: {
          layers: layers,
          blendMode: 'normal',
        },
      };

      const metadataURI = await uploadLayeredMetadataToIPFS(metadata);
      
      // Step 2: Deploy contract
      const contractAddress = await deployCollection(
        address as string,
        collectionDetails,
        metadataURI
      );

      setDeployedAddress(contractAddress);
      
      // Step 3: Save to store
      addDeployedCollection({
        id: Date.now().toString(),
        contractAddress,
        name: collectionDetails.name,
        symbol: collectionDetails.symbol,
        coverImage: layers[0]?.url || null,
        bannerImage: null,
        maxSupply: collectionDetails.maxSupply,
        mintPrice: collectionDetails.mintPrice,
        creatorAddress: address as string,
        deployedAt: Date.now(),
        txHash: txHash || 'pending',
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
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
              <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-crown" />
              Mint Your AI Layered NFT
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Deploy your AI-generated layered NFT collection to the blockchain
            </p>
          </motion.div>

          {!isConnected ? (
            <Card className="royal-card text-center py-12 md:py-16">
              <CardContent>
                <Crown className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="font-display text-lg md:text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
                  Connect your wallet to deploy your AI-generated collection.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Preview */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle>3D Preview</CardTitle>
                  <CardDescription>
                    Interactive layered NFT with parallax effect
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-royal-500/10">
                    <LayeredNFTViewer layers={layers} className="w-full h-full" />
                  </div>
                </CardContent>
              </Card>

              {/* Deployment */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle>Collection Details</CardTitle>
                  <CardDescription>
                    Review and deploy your collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Collection Name</Label>
                    <Input value={collectionDetails.name} disabled className="royal-border" />
                  </div>

                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input value={collectionDetails.symbol} disabled className="royal-border uppercase" />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={collectionDetails.description} disabled className="royal-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Supply</Label>
                      <Input 
                        type="number" 
                        value={collectionDetails.maxSupply} 
                        disabled 
                        className="royal-border" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mint Price (ETH)</Label>
                      <Input value={collectionDetails.mintPrice} disabled className="royal-border" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Royalty (%)</Label>
                    <Input 
                      type="number" 
                      value={collectionDetails.royaltyPercentage} 
                      disabled 
                      className="royal-border" 
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {deployedAddress ? (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-bold">Deployment Successful!</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Contract:</span>{' '}
                          <span className="font-mono">{deployedAddress}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Network:</span> Base
                        </p>
                      </div>
                      <Button
                        asChild
                        className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <a
                          href={`https://basescan.org/address/${deployedAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Basescan
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deploying Contract...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Deploy Collection
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
