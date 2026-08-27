'use client';

/* eslint-disable @next/next/no-img-element -- NFT metadata can reference arbitrary IPFS gateways. */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AlertCircle, Crown, ExternalLink, Loader2, Share2, Shield, Wallet } from 'lucide-react';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { createPublicClient, formatEther, http, isAddress } from 'viem';
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
import { BASE_MAINNET, isBaseNetwork } from '@/lib/store';
import { ROYAL_NFT_ABI } from '@/lib/contracts/contract-source';

type ContractData = {
  name: string;
  symbol: string;
  contractURI: string;
  mintPrice: bigint;
  totalMinted: bigint;
  maxSupply: bigint;
  maxMintPerWallet: bigint;
  mintStartTime: bigint;
  mintEndTime: bigint;
  walletMinted: bigint;
};

type CollectionMetadata = {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  logo_image?: string;
  banner_image?: string;
  banner_image_url?: string;
  featured_image?: string;
  external_link?: string;
};

interface MintPageProps {
  params: { contractAddress: string };
}

function ipfsToHttp(value?: string) {
  if (!value) return '';
  return value.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${value.slice('ipfs://'.length)}`
    : value;
}

function getRpcUrl(chainId?: number) {
  return chainId === 84532 ? 'https://sepolia.base.org' : 'https://mainnet.base.org';
}

export default function MintPage({ params }: MintPageProps) {
  const contractAddress = params.contractAddress;
  const { isConnected, chainId, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [metadata, setMetadata] = useState<CollectionMetadata | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mintMessage, setMintMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const activeReadChainId = chainId === 84532 ? 84532 : 8453;
  const isCorrectNetwork = isBaseNetwork(chainId ?? null);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const explorerBase = activeReadChainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';

  const loadCollection = useCallback(async () => {
    if (!isAddress(contractAddress)) {
      setLoadError('This is not a valid EVM contract address.');
      setContractData(null);
      return;
    }

    try {
      const client = createPublicClient({ transport: http(getRpcUrl(activeReadChainId)) });
      const contract = { address: contractAddress, abi: ROYAL_NFT_ABI } as const;
      const [name, symbol, contractURI, mintPrice, totalMinted, maxSupply, maxMintPerWallet, mintStartTime, mintEndTime] = await Promise.all([
        client.readContract({ ...contract, functionName: 'name' }),
        client.readContract({ ...contract, functionName: 'symbol' }),
        client.readContract({ ...contract, functionName: 'contractURI' }),
        client.readContract({ ...contract, functionName: 'mintPrice' }),
        client.readContract({ ...contract, functionName: 'totalMinted' }),
        client.readContract({ ...contract, functionName: 'maxSupply' }),
        client.readContract({ ...contract, functionName: 'maxMintPerWallet' }),
        client.readContract({ ...contract, functionName: 'mintStartTime' }),
        client.readContract({ ...contract, functionName: 'mintEndTime' }),
      ]);
      const walletMinted = address
        ? await client.readContract({ ...contract, functionName: 'mintedByWallet', args: [address] })
        : BigInt(0);

      setContractData({
        name: name as string,
        symbol: symbol as string,
        contractURI: contractURI as string,
        mintPrice: mintPrice as bigint,
        totalMinted: totalMinted as bigint,
        maxSupply: maxSupply as bigint,
        maxMintPerWallet: maxMintPerWallet as bigint,
        mintStartTime: mintStartTime as bigint,
        mintEndTime: mintEndTime as bigint,
        walletMinted: walletMinted as bigint,
      });

      const metadataUrl = ipfsToHttp(contractURI as string);
      if (metadataUrl) {
        try {
          const response = await fetch(metadataUrl, { cache: 'no-store' });
          if (response.ok) setMetadata(await response.json() as CollectionMetadata);
        } catch {
          setMetadata(null);
        }
      }
      setLoadError(null);
    } catch {
      setContractData(null);
      setMetadata(null);
      setLoadError('No compatible House collection was found at this address on the selected Base network.');
    }
  }, [activeReadChainId, address, contractAddress]);

  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);

  const remainingSupply = contractData
    ? contractData.maxSupply - contractData.totalMinted
    : BigInt(0);
  const remainingWalletAllowance = contractData
    ? contractData.maxMintPerWallet === BigInt(0)
      ? remainingSupply
      : contractData.maxMintPerWallet - contractData.walletMinted
    : BigInt(0);
  const quantityLimit = Math.max(
    1,
    Math.min(10, Number(remainingSupply), Number(remainingWalletAllowance)),
  );
  const progress = contractData && contractData.maxSupply > BigInt(0)
    ? Math.min(100, (Number(contractData.totalMinted) / Number(contractData.maxSupply)) * 100)
    : 0;
  const now = Math.floor(Date.now() / 1000);
  const mintNotStarted = Boolean(contractData && Number(contractData.mintStartTime) > now);
  const mintEnded = Boolean(contractData && contractData.mintEndTime > BigInt(0) && Number(contractData.mintEndTime) < now);
  const soldOut = Boolean(contractData && remainingSupply <= BigInt(0));
  const walletLimitReached = Boolean(
    contractData
      && contractData.maxMintPerWallet > BigInt(0)
      && remainingWalletAllowance <= BigInt(0),
  );
  const coverImage = ipfsToHttp(metadata?.image || metadata?.image_url || metadata?.logo_image);
  const bannerImage = ipfsToHttp(metadata?.banner_image || metadata?.banner_image_url || metadata?.featured_image);
  const collectionName = metadata?.name || contractData?.name || 'Collection';
  const mintDisabled = isMinting || !isCorrectNetwork || !contractData || !!loadError || soldOut || walletLimitReached || mintNotStarted || mintEnded;

  useEffect(() => {
    if (mintQuantity > quantityLimit) setMintQuantity(quantityLimit);
  }, [mintQuantity, quantityLimit]);

  const handleMint = async () => {
    if (!walletClient || !contractData || !isConnected || !isCorrectNetwork || mintDisabled) return;
    setIsMinting(true);
    setMintMessage(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: ROYAL_NFT_ABI,
        functionName: 'mint',
        args: [BigInt(mintQuantity), '0x0000000000000000000000000000000000000000'],
        value: contractData.mintPrice * BigInt(mintQuantity),
      });
      setTxHash(hash);
      const client = createPublicClient({ transport: http(getRpcUrl(activeReadChainId)) });
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 5 * 60 * 1000 });
      if (receipt.status === 'reverted') throw new Error('The mint transaction reverted.');
      setMintMessage(`Successfully minted ${mintQuantity} NFT${mintQuantity === 1 ? '' : 's'}.`);
      await loadCollection();
    } catch (error) {
      setMintMessage(error instanceof Error ? error.message : 'Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const saleLabel = useMemo(() => {
    if (soldOut) return 'Sold out';
    if (walletLimitReached) return 'Wallet mint limit reached';
    if (mintNotStarted) return 'Mint has not started';
    if (mintEnded) return 'Mint has ended';
    return null;
  }, [mintEnded, mintNotStarted, soldOut, walletLimitReached]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link href="/collections" className="text-sm text-crown hover:text-gold-400">← Back to Collections</Link>
            {isAddress(contractAddress) && (
              <a href={`${explorerBase}/address/${contractAddress}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-crown">
                View contract <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 h-40 overflow-hidden rounded-2xl border border-royal-500/20 bg-gradient-to-br from-royal-500/20 to-gold-500/20 sm:h-56 lg:h-72">
            {bannerImage ? <img src={bannerImage} alt={`${collectionName} banner`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Crown className="h-16 w-16 text-crown/20" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </motion.div>

          <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <div className="relative -mt-20 ml-3 h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-xl sm:h-36 sm:w-36">
              {coverImage ? <img src={coverImage} alt={`${collectionName} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Crown className="h-12 w-12 text-crown/30" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-3xl font-bold sm:text-4xl">{collectionName}</h1>
                {contractData && <Shield className="h-5 w-5 shrink-0 text-crown" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{contractData?.symbol ? `$${contractData.symbol} · ` : ''}{contractAddress}</p>
            </div>
          </div>

          {loadError ? (
            <Card className="royal-card mx-auto max-w-2xl">
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                <h2 className="font-display text-2xl font-semibold">Collection not found</h2>
                <p className="mt-3 text-muted-foreground">{loadError}</p>
                <Button asChild className="gold-button mt-6"><Link href="/collections">Browse collections</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card className="royal-card">
                  <CardHeader><CardTitle>Collection artwork</CardTitle></CardHeader>
                  <CardContent>
                    <div className="aspect-square overflow-hidden rounded-xl bg-royal-950/50">
                      {coverImage ? <img src={coverImage} alt={collectionName} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center"><Crown className="h-24 w-24 text-crown/20" /></div>}
                    </div>
                  </CardContent>
                </Card>
                <Card className="royal-card">
                  <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                  <CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{metadata?.description || 'No collection description was published.'}</p></CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="royal-card-gold sticky top-24">
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-xl font-bold gold-text">{contractData?.totalMinted.toString() || '—'}</p><p className="text-xs text-muted-foreground">Minted</p></div>
                      <div><p className="text-xl font-bold gold-text">{contractData ? remainingSupply.toString() : '—'}</p><p className="text-xs text-muted-foreground">Remaining</p></div>
                      <div><p className="text-xl font-bold gold-text">{contractData ? formatEther(contractData.mintPrice) : '—'}</p><p className="text-xs text-muted-foreground">ETH each</p></div>
                    </div>
                    <div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span>{progress.toFixed(1)}%</span></div><div className="royal-progress"><div className="royal-progress-bar" style={{ width: `${progress}%` }} /></div></div>

                    {isConnected && !isCorrectNetwork && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                        <p className="font-medium text-destructive">Wrong network</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => switchChain({ chainId: BASE_MAINNET.id })}>Switch to Base</Button>
                      </div>
                    )}
                    {saleLabel && <div className="rounded-lg border border-crown/30 bg-crown/10 p-3 text-center text-sm font-medium text-crown">{saleLabel}</div>}

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Quantity</label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))} disabled={mintQuantity <= 1}>−</Button>
                        <div className="flex-1 text-center text-2xl font-bold">{mintQuantity}</div>
                        <Button variant="outline" size="icon" onClick={() => setMintQuantity(Math.min(quantityLimit, mintQuantity + 1))} disabled={mintQuantity >= quantityLimit}>+</Button>
                      </div>
                      {contractData && contractData.maxMintPerWallet > BigInt(0) && <p className="text-center text-xs text-muted-foreground">You minted {contractData.walletMinted.toString()} of {contractData.maxMintPerWallet.toString()} allowed.</p>}
                    </div>
                    <Separator className="bg-royal-500/20" />
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Total</span><span className="text-xl font-bold gold-text">{contractData ? formatEther(contractData.mintPrice * BigInt(mintQuantity)) : '—'} ETH</span></div>

                    {!isConnected ? (
                      <ConnectButton.Custom>{({ openConnectModal }) => <Button onClick={openConnectModal} className="gold-button h-12 w-full"><Wallet className="mr-2 h-5 w-5" />Connect wallet</Button>}</ConnectButton.Custom>
                    ) : (
                      <Button onClick={handleMint} disabled={mintDisabled} className="gold-button h-12 w-full">
                        {isMinting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Confirming mint</> : <><Crown className="mr-2 h-5 w-5" />Mint {mintQuantity}</>}
                      </Button>
                    )}

                    {mintMessage && <div className="rounded-lg border border-royal-500/30 bg-royal-500/10 p-3 text-sm">{mintMessage}{txHash && <a href={`${explorerBase}/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-crown">View transaction <ExternalLink className="h-3.5 w-3.5" /></a>}</div>}
                  </CardContent>
                </Card>

                <Card className="royal-card">
                  <CardContent className="flex items-center justify-between pt-6">
                    <h3 className="flex items-center gap-2 font-semibold"><Share2 className="h-4 w-4 text-crown" />Share mint page</h3>
                    <Dialog><DialogTrigger asChild><Button variant="outline" size="sm">QR code</Button></DialogTrigger><DialogContent className="royal-card"><DialogHeader><DialogTitle>Share collection</DialogTitle><DialogDescription>Scan to open this mint page.</DialogDescription></DialogHeader><div className="flex justify-center py-4"><QRCodeSVG value={shareUrl} size={200} bgColor="#1a0a2e" fgColor="#ffd700" /></div></DialogContent></Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
