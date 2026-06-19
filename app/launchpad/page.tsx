'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Upload,
  Layers,
  ImageIcon,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Info,
  Shuffle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Rocket,
  FileCode2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, isBaseNetwork, BASE_MAINNET } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ROYAL_NFT_SOURCE_CODE, COMPILER_VERSION, CONTRACT_NAME } from '@/lib/contracts/contract-source';
import { CONTRACTS } from '@/lib/config';

// Declare window.ethereum for Web3 wallet
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Layer {
  id: string;
  name: string;
  order: number;
  traits: Trait[];
  isRequired: boolean;
}

interface Trait {
  id: string;
  name: string;
  file: File | null;
  preview: string;
  rarity: number;
}

type DeployStatus = 'idle' | 'deploying' | 'deployed' | 'verifying' | 'verified' | 'error';

const STEPS = [
  { id: 'details', label: 'Collection Details', icon: Crown },
  { id: 'layers', label: 'Layer Setup', icon: Layers },
  { id: 'generate', label: 'Generate & Preview', icon: Sparkles },
  { id: 'deploy', label: 'Deploy', icon: ArrowRight },
];

// Generate a random NFT by picking one trait from each layer
function generateRandomNFT(layers: Layer[]): string[] {
  const picks: string[] = [];
  for (const layer of layers) {
    if (layer.traits.length === 0) continue;
    // Weighted random based on rarity
    const totalWeight = layer.traits.reduce((sum, t) => sum + t.rarity, 0);
    let rand = Math.random() * totalWeight;
    for (const trait of layer.traits) {
      rand -= trait.rarity;
      if (rand <= 0) {
        picks.push(trait.preview);
        break;
      }
    }
  }
  return picks;
}

// Factory ABI for createCollection function
const FACTORY_ABI = [
  {
    name: 'createCollection',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'p',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'contractURI', type: 'string' },
          { name: 'baseURI', type: 'string' },
          { name: 'unrevealedURI', type: 'string' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'mintPrice', type: 'uint256' },
          { name: 'maxMintPerWallet', type: 'uint256' },
          { name: 'mintStart', type: 'uint64' },
          { name: 'mintEnd', type: 'uint64' },
          { name: 'revealTime', type: 'uint64' },
          { name: 'royaltyReceiver', type: 'address' },
          { name: 'royaltyBps', type: 'uint96' },
          { name: 'allowlistRoot', type: 'bytes32' },
        ],
      },
    ],
    outputs: [{ type: 'address' }],
  },
] as const;

// Compose images onto a canvas
async function composeNFT(traitUrls: string[], size: number = 512): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Fill with transparent
    ctx.clearRect(0, 0, size, size);

    let loadedCount = 0;
    let hasError = false;
    let resolved = false;

    if (traitUrls.length === 0) {
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    // Set a timeout to force resolution after 5 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(canvas.toDataURL('image/png'));
      }
    }, 5000);

    const checkComplete = () => {
      if (loadedCount === traitUrls.length && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    traitUrls.forEach((url) => {
      if (!url) {
        loadedCount++;
        checkComplete();
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (!hasError) {
          try {
            ctx.drawImage(img, 0, 0, size, size);
          } catch (e) {
            console.error('Error drawing image:', e);
            hasError = true;
          }
        }
        loadedCount++;
        checkComplete();
      };

      img.onerror = () => {
        console.error('Error loading image:', url);
        loadedCount++;
        checkComplete();
      };

      img.src = url;
    });
  });
}

export default function CreatePage() {
  const { isConnected, address, chainId } = useWalletStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [collectionDetails, setCollectionDetails] = useState({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 10000,
    mintPrice: '0.05',
    royaltyPercentage: 5,
    bannerImage: null as string | null,
    coverImage: null as string | null,
  });
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewNFTs, setPreviewNFTs] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Deployment state
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isCorrectNetwork = isBaseNetwork(chainId);

  const addLayer = () => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      order: layers.length,
      traits: [],
      isRequired: true,
    };
    setLayers([...layers, newLayer]);
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id).map((l, i) => ({ ...l, order: i })));
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (direction === 'up' && index > 0) {
      const newLayers = [...layers];
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      setLayers(newLayers.map((l, i) => ({ ...l, order: i })));
    } else if (direction === 'down' && index < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers.map((l, i) => ({ ...l, order: i })));
    }
  };

  const addTrait = (layerId: string, files: FileList) => {
    const newTraits: Trait[] = Array.from(files).map((file) => {
      const reader = new FileReader();
      let preview = '';
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        preview = result;
        // Update the trait with the data URL
        setLayers(current => current.map(l =>
          l.id === layerId
            ? {
                ...l,
                traits: l.traits.map(t =>
                  t.name === file.name.replace(/\.[^/.]+$/, '')
                    ? { ...t, preview: result }
                    : t
                ),
              }
            : l
        ));
      };
      
      reader.readAsDataURL(file);
      
      return {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        file,
        preview: URL.createObjectURL(file), // Fallback while loading
        rarity: 100,
      };
    });

    setLayers(layers.map(l =>
      l.id === layerId
        ? { ...l, traits: [...l.traits, ...newTraits] }
        : l
    ));
  };

  const updateTrait = (layerId: string, traitId: string, updates: Partial<Trait>) => {
    setLayers(layers.map(l =>
      l.id === layerId
        ? {
            ...l,
            traits: l.traits.map(t =>
              t.id === traitId ? { ...t, ...updates } : t
            ),
          }
        : l
    ));
  };

  const removeTrait = (layerId: string, traitId: string) => {
    setLayers(layers.map(l =>
      l.id === layerId
        ? { ...l, traits: l.traits.filter(t => t.id !== traitId) }
        : l
    ));
  };

  const handleGenerate = async () => {
    if (layers.length === 0 || layers.every(l => l.traits.length === 0)) return;

    setGenerating(true);
    setGenerationProgress(0);
    setShowPreview(true);
    setPreviewNFTs([]);

    const count = Math.min(9, collectionDetails.maxSupply);
    const generated: string[] = [];

    for (let i = 0; i < count; i++) {
      const traitUrls = generateRandomNFT(layers);
      if (traitUrls.length > 0) {
        const composed = await composeNFT(traitUrls, 512);
        if (composed) {
          generated.push(composed);
        }
      }
      const progress = Math.round(((i + 1) / count) * 100);
      setGenerationProgress(progress);
      setPreviewNFTs([...generated]); // Update preview in real-time
    }

    setGenerating(false);
  };

  const handleRegenerateOne = async (index: number) => {
    const traitUrls = generateRandomNFT(layers);
    if (traitUrls.length === 0) return;
    const composed = await composeNFT(traitUrls, 512);
    if (composed) {
      setPreviewNFTs(prev => {
        const next = [...prev];
        next[index] = composed;
        return next;
      });
    }
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${collectionDetails.symbol || 'nft'}_${index + 1}.png`;
    link.click();
  };

  const handleDeploy = async () => {
    if (!address || !isCorrectNetwork) return;

    setDeployStatus('deploying');
    setDeployError(null);
    setDeployTxHash(null);
    setContractAddress(null);
    setVerificationUrl(null);

    try {
      // Use placeholder URIs for now (IPFS upload can be done server-side later)
      const contractURI = 'ipfs://QmPlaceholderContractURI';
      const baseURI = 'ipfs://QmPlaceholderBaseURI/';

      console.log('Deploying collection...');

      // Dynamically import viem functions only when needed (client-side)
      const { encodeFunctionData, parseEther } = await import('viem');

      // Check if window.ethereum exists
      if (!window.ethereum) {
        throw new Error('Web3 wallet not found. Please install MetaMask or another Web3 wallet.');
      }

      // Request to switch to correct chain if needed
      const targetChainId = chainId === 84532 ? '0x14a34' : '0x2105'; // Base Sepolia or Base Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError: any) {
        // Chain not added to wallet
        if (switchError.code === 4902) {
          throw new Error('Base network not added to your wallet. Please add it manually.');
        }
      }

      // Set deployment fee to 0.0001 ETH (convert to hex string for transaction)
      const deploymentFeeWei = parseEther('0.0001');
      const deploymentFee = '0x' + deploymentFeeWei.toString(16);

      // Prepare collection parameters with IPFS URIs
      const collectionParams = {
        name: collectionDetails.name,
        symbol: collectionDetails.symbol,
        contractURI: contractURI,
        baseURI: baseURI,
        unrevealedURI: baseURI, // Use same for now
        maxSupply: BigInt(collectionDetails.maxSupply),
        mintPrice: parseEther(collectionDetails.mintPrice),
        maxMintPerWallet: BigInt(0), // 0 = unlimited
        mintStart: BigInt(Math.floor(Date.now() / 1000)), // Start now
        mintEnd: BigInt(0), // 0 = no end time
        revealTime: BigInt(0), // 0 = no reveal time
        royaltyReceiver: address as `0x${string}`,
        royaltyBps: BigInt(collectionDetails.royaltyPercentage * 100), // Convert % to basis points
        allowlistRoot: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
      };

      console.log('Collection parameters:', collectionParams);

      // Encode the function call
      const encodedData = encodeFunctionData({
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [collectionParams],
      });

      // Prepare transaction with deployment fee
      const txParams = {
        from: address,
        to: CONTRACTS.FACTORY as `0x${string}`,
        data: encodedData,
        value: deploymentFee, // Send the deployment fee
      };

      // Send transaction via wallet
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setDeployTxHash(txHash);
      
      // Wait for transaction confirmation
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes
      const pollInterval = 3 * 1000; // 3 seconds
      const startTime = Date.now();
      let receipt = null;

      while (!receipt && Date.now() - startTime < maxWaitTime) {
        try {
          const result = await window.ethereum.request({
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
        throw new Error('Transaction confirmation timeout. Please check the status on Basescan.');
      }

      if (receipt.status === '0x0') {
        throw new Error('Transaction failed. Please check the transaction details on Basescan.');
      }

      // Parse CollectionCreated event from logs
      // Event signature: CollectionCreated(indexed creator, indexed collection, string name, string symbol)
      let deployedCollectionAddress = receipt.contractAddress;
      
      if (receipt.logs && receipt.logs.length > 0) {
        // The event is emitted by the factory, look for CollectionCreated events
        // Topic: keccak256('CollectionCreated(address,address,string,string)')
        const eventSignature = '0x' + Array.from(new Uint8Array(32)).map(() => '0').join('');
        
        for (const log of receipt.logs) {
          // Check if this is an event from the factory contract
          if (log.address?.toLowerCase() === CONTRACTS.FACTORY.toLowerCase()) {
            // The second indexed parameter (collection address) is at topics[2]
            if (log.topics && log.topics.length >= 3) {
              const collectionAddr = '0x' + log.topics[2].slice(-40);
              deployedCollectionAddress = collectionAddr;
              break;
            }
          }
        }
      }

      const explorerBase = chainId === 84532
        ? 'https://sepolia.basescan.org'
        : 'https://basescan.org';
      
      setDeployStatus('deployed');
      setContractAddress(deployedCollectionAddress || 'See transaction details');
      setDeployTxHash(txHash);
      setVerificationUrl(`${explorerBase}/tx/${txHash}`);

      // Attempt automatic verification if we found a contract address
      if (deployedCollectionAddress && deployedCollectionAddress !== 'See transaction details') {
        await verifyContract(deployedCollectionAddress, chainId as number, txHash);
      }

    } catch (error: any) {
      console.error('Deployment failed:', error);
      let errorMessage = 'Deployment failed. Please try again.';
      
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.code === -32603) {
        errorMessage = 'RPC error. Please try again or check network connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setDeployError(errorMessage);
      setDeployStatus('error');
    }
  };

  const verifyContract = async (contractAddr: string, networkChainId: number, txHash?: string) => {
    setDeployStatus('verifying');

    try {
      const response = await fetch('/api/verify-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: contractAddr,
          deployerAddress: address,
          name: collectionDetails.name,
          symbol: collectionDetails.symbol,
          description: collectionDetails.description,
          maxSupply: collectionDetails.maxSupply,
          mintPrice: collectionDetails.mintPrice,
          royaltyPercentage: collectionDetails.royaltyPercentage,
          contractURI: deployTxHash ? 'pending' : '',
          baseURI: 'pending',
          coverImageUrl: collectionDetails.coverImage || '',
          bannerImageUrl: collectionDetails.bannerImage || '',
          transactionHash: txHash || deployTxHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeployStatus('verified');
        const explorerBase = networkChainId === 84532
          ? 'https://sepolia.basescan.org'
          : 'https://basescan.org';
        setVerificationUrl(`${explorerBase}/address/${contractAddr}`);
      } else {
        setDeployStatus('deployed');
        setDeployError(data.error || 'Collection saved. You can view it on Basescan.');
        const explorerBase = networkChainId === 84532
          ? 'https://sepolia.basescan.org'
          : 'https://basescan.org';
        setVerificationUrl(`${explorerBase}/address/${contractAddr}`);
      }
    } catch (error: any) {
      setDeployStatus('deployed');
      console.error('Verification error:', error);
      const explorerBase = networkChainId === 84532
        ? 'https://sepolia.basescan.org'
        : 'https://basescan.org';
      setVerificationUrl(`${explorerBase}/address/${contractAddr}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx') => {
    const base = chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';
    return `${base}/${type}/${hash}`;
  };

  const totalTraits = layers.reduce((sum, l) => sum + l.traits.length, 0);
  const totalCombinations = layers.reduce(
    (prod, l) => prod * Math.max(l.traits.length, 1),
    1
  );

  const canDeploy = isConnected && isCorrectNetwork && collectionDetails.name && collectionDetails.symbol;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 max-w-6xl mx-auto">
          {/* Step Navigation */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between gap-1 md:gap-2 bg-gradient-to-r from-royal-500/10 to-crown/10 p-3 md:p-6 rounded-lg md:rounded-xl border border-royal-500/20">
              {STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      'flex flex-col items-center gap-1 md:gap-2 transition-all duration-300 flex-1',
                      currentStep === i
                        ? 'text-crown'
                        : i < currentStep
                        ? 'text-green-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 font-display font-bold text-xs md:text-base',
                        currentStep === i
                          ? 'bg-gradient-to-br from-crown/30 to-royal-500/20 border-2 border-crown shadow-lg shadow-crown/50'
                          : i < currentStep
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-royal-500/10 border-2 border-royal-500/30'
                      )}
                    >
                      <step.icon className="h-3 w-3 md:h-5 md:w-5" />
                    </div>
                    <span className="text-xs font-medium hidden md:block text-center leading-tight">
                      {step.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 md:h-1 mx-0.5 md:mx-2 rounded-full',
                        i < currentStep ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-royal-500/20'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Collection Details */}
              {currentStep === 0 && (
                <Card className="royal-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-crown" />
                      Collection Details
                    </CardTitle>
                    <CardDescription>
                      Set up your collection's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Collection Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Cyber Royals"
                          value={collectionDetails.name}
                          onChange={(e) =>
                            setCollectionDetails({
                              ...collectionDetails,
                              name: e.target.value,
                            })
                          }
                          className="royal-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol">Symbol</Label>
                        <Input
                          id="symbol"
                          placeholder="e.g., CR"
                          maxLength={10}
                          value={collectionDetails.symbol}
                          onChange={(e) =>
                            setCollectionDetails({
                              ...collectionDetails,
                              symbol: e.target.value.toUpperCase(),
                            })
                          }
                          className="royal-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your collection..."
                        rows={4}
                        value={collectionDetails.description}
                        onChange={(e) =>
                          setCollectionDetails({
                            ...collectionDetails,
                            description: e.target.value,
                          })
                        }
                        className="royal-textarea"
                      />
                    </div>

                    {/* Banner Image Upload */}
                    <div className="space-y-2">
                      <Label>Banner Image</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Recommended: 1400x400px (JPG, PNG)
                      </p>
                      {collectionDetails.bannerImage ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-gold-500/50">
                          <img
                            src={collectionDetails.bannerImage}
                            alt="Banner Preview"
                            className="w-full h-32 object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              setCollectionDetails({
                                ...collectionDetails,
                                bannerImage: null,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-royal-500/30 rounded-lg cursor-pointer hover:border-gold-500/50 transition-colors">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-sm">Drop banner image or click to browse</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setCollectionDetails({
                                    ...collectionDetails,
                                    bannerImage: result,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </Label>
                      )}
                    </div>

                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Recommended: 500x500px (JPG, PNG)
                      </p>
                      {collectionDetails.coverImage ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-gold-500/50">
                          <img
                            src={collectionDetails.coverImage}
                            alt="Cover Preview"
                            className="w-full h-32 object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              setCollectionDetails({
                                ...collectionDetails,
                                coverImage: null,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-royal-500/30 rounded-lg cursor-pointer hover:border-gold-500/50 transition-colors">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-sm">Drop cover image or click to browse</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setCollectionDetails({
                                    ...collectionDetails,
                                    coverImage: result,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </Label>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxSupply">Max Supply</Label>
                        <Input
                          id="maxSupply"
                          type="number"
                          min={1}
                          max={100000}
                          value={collectionDetails.maxSupply}
                          onChange={(e) =>
                            setCollectionDetails({
                              ...collectionDetails,
                              maxSupply: parseInt(e.target.value) || 10000,
                            })
                          }
                          className="royal-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                        <Input
                          id="mintPrice"
                          type="number"
                          step="0.001"
                          min={0}
                          value={collectionDetails.mintPrice}
                          onChange={(e) =>
                            setCollectionDetails({
                              ...collectionDetails,
                              mintPrice: e.target.value,
                            })
                          }
                          className="royal-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="royalty">Royalty %</Label>
                        <Input
                          id="royalty"
                          type="number"
                          min={0}
                          max={50}
                          value={collectionDetails.royaltyPercentage}
                          onChange={(e) =>
                            setCollectionDetails({
                              ...collectionDetails,
                              royaltyPercentage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="royal-input"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Layer Setup */}
              {currentStep === 1 && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <Card className="royal-card text-center">
                      <CardContent className="pt-4 md:pt-6">
                        <div className="text-xl md:text-2xl font-bold gold-text">{layers.length}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Layers</div>
                      </CardContent>
                    </Card>
                    <Card className="royal-card text-center">
                      <CardContent className="pt-4 md:pt-6">
                        <div className="text-xl md:text-2xl font-bold gold-text">{totalTraits}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Traits</div>
                      </CardContent>
                    </Card>
                    <Card className="royal-card text-center">
                      <CardContent className="pt-4 md:pt-6">
                        <div className="text-xl md:text-2xl font-bold gold-text">
                          {totalCombinations > 1000000
                            ? `${(totalCombinations / 1000000).toFixed(1)}M`
                            : totalCombinations.toLocaleString()}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">Combinations</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    onClick={addLayer}
                    className="w-full gold-button h-12 md:h-14 text-base md:text-lg"
                  >
                    <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Add Layer
                  </Button>

                  <AnimatePresence>
                    {layers.map((layer, index) => (
                      <motion.div
                        key={layer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                      >
                        <Card className="royal-card">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveLayer(layer.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveLayer(layer.id, 'down')}
                                    disabled={index === layers.length - 1}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Input
                                  value={layer.name}
                                  onChange={(e) =>
                                    updateLayer(layer.id, { name: e.target.value })
                                  }
                                  className="text-lg font-semibold border-transparent bg-transparent hover:border-royal-500/30 focus:border-gold-500 w-48"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-gold-500/30">
                                  {layer.traits.length} traits
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => removeLayer(layer.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-royal-500/30 rounded-lg cursor-pointer hover:border-gold-500/50 transition-colors">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Upload className="h-8 w-8" />
                                <span className="text-sm">Drop trait images or click to browse</span>
                              </div>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  e.target.files && addTrait(layer.id, e.target.files)
                                }
                              />
                            </Label>

                            {layer.traits.length > 0 && (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 mt-4">
                                {layer.traits.map((trait) => (
                                  <div
                                    key={trait.id}
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-royal-500/30 hover:border-gold-500/50 transition-colors"
                                  >
                                    <img
                                      src={trait.preview}
                                      alt={trait.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="absolute bottom-0 left-0 right-0 p-2">
                                        <input
                                          value={trait.name}
                                          onChange={(e) =>
                                            updateTrait(layer.id, trait.id, {
                                              name: e.target.value,
                                            })
                                          }
                                          className="w-full bg-transparent text-white text-xs font-medium border-b border-white/20 focus:border-gold-500 outline-none"
                                        />
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-xs text-white/60">Rarity:</span>
                                          <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={trait.rarity}
                                            onChange={(e) =>
                                              updateTrait(layer.id, trait.id, {
                                                rarity: parseInt(e.target.value) || 1,
                                              })
                                            }
                                            className="w-12 h-5 text-xs bg-white/10 border-0"
                                          />
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeTrait(layer.id, trait.id)}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:bg-destructive transition-opacity"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {layers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No layers added yet. Click &quot;Add Layer&quot; to begin.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Generate & Preview */}
              {currentStep === 2 && (
                <Card className="royal-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-crown" />
                      Generate Collection
                    </CardTitle>
                    <CardDescription>
                      Review your settings and generate NFT previews
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-3 md:space-y-4">
                        <h3 className="font-semibold text-sm md:text-base">Collection Summary</h3>
                        <div className="space-y-2 text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium text-right">{collectionDetails.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Symbol:</span>
                            <span className="font-medium text-right">{collectionDetails.symbol || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supply:</span>
                            <span className="font-medium text-right">{collectionDetails.maxSupply.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium text-right">{collectionDetails.mintPrice} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Royalty:</span>
                            <span className="font-medium text-right">{collectionDetails.royaltyPercentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <h3 className="font-semibold text-sm md:text-base">Generation Stats</h3>
                        <div className="space-y-2 text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Layers:</span>
                            <span className="font-medium text-right">{layers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Traits:</span>
                            <span className="font-medium text-right">{totalTraits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Possible:</span>
                            <span className="font-medium text-right">{totalCombinations.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-royal-500/20" />

                    {generating ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Generating previews...</span>
                          <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                        </div>
                        <div className="w-full bg-royal-500/20 rounded-full h-2 overflow-hidden border border-royal-500/30">
                          <motion.div
                            className="h-full bg-gradient-to-r from-crown to-gold-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${generationProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Composing layers into unique NFTs...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Button
                          onClick={handleGenerate}
                          disabled={layers.length === 0 || totalTraits === 0}
                          className="w-full gold-button h-14 text-lg"
                        >
                          <Shuffle className="mr-2 h-5 w-5" />
                          Generate Preview
                        </Button>

                        {layers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center">
                            Add at least one layer with traits to generate your collection.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Preview Grid */}
                    {showPreview && previewNFTs.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-4">Preview NFTs</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                          {previewNFTs.map((nft, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="relative group"
                            >
                              <div className="aspect-square rounded-xl overflow-hidden border border-royal-500/30 bg-royal-950/50">
                                <img
                                  src={nft}
                                  alt={`Preview ${i + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-white hover:text-crown"
                                  onClick={() => handleRegenerateOne(i)}
                                  title="Regenerate"
                                >
                                  <RefreshCw className="h-5 w-5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-white hover:text-crown"
                                  onClick={() => handleDownload(nft, i)}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </Button>
                              </div>
                              <div className="absolute bottom-2 left-2">
                                <Badge variant="secondary" className="bg-black/60 text-white border-0">
                                  #{i + 1}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showPreview && previewNFTs.length === 0 && !generating && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click &quot;Generate Preview&quot; to create NFTs from your layers.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Deploy */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card className="royal-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-crown" />
                        Deploy Your Collection
                      </CardTitle>
                      <CardDescription>
                        Review everything and deploy your smart contract
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!isConnected ? (
                        <div className="text-center py-8">
                          <Crown className="h-12 w-12 mx-auto mb-4 text-muted" />
                          <h3 className="font-semibold mb-2">Connect Wallet</h3>
                          <p className="text-muted-foreground mb-4">
                            Connect your wallet to deploy your collection
                          </p>
                        </div>
                      ) : !isCorrectNetwork ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                          <h3 className="font-semibold mb-2">Wrong Network</h3>
                          <p className="text-muted-foreground mb-4">
                            Please switch to Base to deploy your collection
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Deployment Checklist */}
                          <div className="p-4 rounded-lg bg-royal-500/10 border border-royal-500/30">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-gold-500 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium mb-1">Deployment Checklist</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                  <li>Deployment fee: 0.0001 ETH (sent to House wallet)</li>
                                  <li>Make sure you have enough ETH for gas fees + deployment fee</li>
                                  <li>Contract will be automatically verified on Basescan</li>
                                  <li>After deployment, your collection will be live on Base</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Collection Summary */}
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium ml-2">{collectionDetails.name || 'Not set'}</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Symbol:</span>
                              <span className="font-medium ml-2">{collectionDetails.symbol || 'Not set'}</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Max Supply:</span>
                              <span className="font-medium ml-2">{collectionDetails.maxSupply.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Mint Price:</span>
                              <span className="font-medium ml-2">{collectionDetails.mintPrice} ETH</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Royalty:</span>
                              <span className="font-medium ml-2">{collectionDetails.royaltyPercentage}%</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-muted-foreground">Network:</span>
                              <span className="font-medium ml-2">{chainId === BASE_MAINNET.id ? 'Base Mainnet' : 'Base Sepolia'}</span>
                            </div>
                          </div>

                          {/* Deploy Button */}
                          {deployStatus === 'idle' && (
                            <div className="flex flex-col gap-4">
                              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
                                <p className="font-medium mb-2">💡 Tip:</p>
                                <p>
                                  For full contract deployment with parameter encoding, use the 
                                  <a 
                                    href={`https://basescan.org/address/${CONTRACTS.FACTORY}#writeContract`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-crown hover:underline ml-1"
                                  >
                                    Basescan contract interaction tool
                                  </a>
                                  .
                                </p>
                              </div>
                              <Button
                                onClick={handleDeploy}
                                disabled={!canDeploy || !collectionDetails.name || !collectionDetails.symbol}
                                className="w-full gold-button h-12 md:h-14 text-base md:text-lg"
                              >
                                <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                Prepare Deployment
                              </Button>
                              <p className="text-xs text-muted-foreground text-center">
                                Your collection details have been prepared and can be deployed via Web3 wallet integration.
                              </p>
                            </div>
                          )}

                          {/* Deploying */}
                          {deployStatus === 'deploying' && (
                            <div className="text-center py-6 space-y-4">
                              <Loader2 className="h-10 w-10 animate-spin text-crown mx-auto" />
                              <div>
                                <p className="font-semibold">Deploying Contract...</p>
                                <p className="text-sm text-muted-foreground">Please confirm the transaction in your wallet</p>
                              </div>
                            </div>
                          )}

                          {/* Deployed - Verifying */}
                          {deployStatus === 'deployed' && (
                            <div className="text-center py-6 space-y-4">
                              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                              <div>
                                <p className="font-semibold">Contract Deployed!</p>
                                <p className="text-sm text-muted-foreground">Now verifying on Basescan...</p>
                              </div>
                              {contractAddress && (
                                <div className="flex items-center justify-center gap-2">
                                  <code className="text-sm bg-royal-500/10 px-3 py-1 rounded">
                                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleCopy(contractAddress)}
                                  >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}
                              {deployTxHash && (
                                <a
                                  href={getExplorerUrl(deployTxHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-crown hover:underline"
                                >
                                  View Transaction <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Verifying */}
                          {deployStatus === 'verifying' && (
                            <div className="text-center py-6 space-y-4">
                              <Loader2 className="h-10 w-10 animate-spin text-crown mx-auto" />
                              <div>
                                <p className="font-semibold">Verifying on Basescan...</p>
                                <p className="text-sm text-muted-foreground">This may take a minute</p>
                              </div>
                              {contractAddress && (
                                <div className="flex items-center justify-center gap-2">
                                  <code className="text-sm bg-royal-500/10 px-3 py-1 rounded">
                                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleCopy(contractAddress)}
                                  >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Verified */}
                          {deployStatus === 'verified' && (
                            <div className="text-center py-6 space-y-4">
                              <ShieldCheck className="h-10 w-10 text-green-500 mx-auto" />
                              <div>
                                <p className="font-semibold">Contract Verified!</p>
                                <p className="text-sm text-muted-foreground">Your contract is now verified on Basescan</p>
                              </div>
                              {contractAddress && (
                                <div className="flex items-center justify-center gap-2">
                                  <code className="text-sm bg-royal-500/10 px-3 py-1 rounded">
                                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleCopy(contractAddress)}
                                  >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {verificationUrl && (
                                  <a
                                    href={verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" className="royal-border">
                                      <FileCode2 className="mr-2 h-4 w-4" />
                                      View on Basescan
                                    </Button>
                                  </a>
                                )}
                                <a href={`/mint/${contractAddress}`}>
                                  <Button className="gold-button">
                                    <Rocket className="mr-2 h-4 w-4" />
                                    Go to Mint Page
                                  </Button>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {deployStatus === 'error' && (
                            <div className="text-center py-6 space-y-4">
                              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                              <div>
                                <p className="font-semibold text-destructive">Deployment Failed</p>
                                <p className="text-sm text-muted-foreground">{deployError}</p>
                              </div>
                              <Button
                                onClick={() => {
                                  setDeployStatus('idle');
                                  setDeployError(null);
                                }}
                                variant="outline"
                                className="royal-border"
                              >
                                Try Again
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contract Info Card */}
                  {deployStatus === 'verified' && (
                    <Card className="royal-card-gold">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          Verified Contract
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div className="text-sm">
                            <p className="font-medium text-green-500">Basescan Verified</p>
                            <p className="text-muted-foreground">Source code is publicly available and verified</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Contract Name:</span>
                            <p className="font-medium">{CONTRACT_NAME}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Compiler:</span>
                            <p className="font-medium">{COMPILER_VERSION}</p>
                          </div>
                        </div>
                        {verificationUrl && (
                          <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-crown hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Verified Source on Basescan
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="royal-border"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
              disabled={currentStep === STEPS.length - 1}
              className="royal-button"
            >
              Next
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
