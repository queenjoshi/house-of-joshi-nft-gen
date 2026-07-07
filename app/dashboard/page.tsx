'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  TrendingUp,
  Users,
  DollarSign,
  Image as ImageIcon,
  BarChart3,
  Activity,
  ExternalLink,
  Sparkles,
  Package,
  Pencil,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, useCollectionsStore, useAIGenerationStore } from '@/lib/store';
import { getCollections, getUser, updateCollectionByAddress } from '@/lib/supabase';
import Link from 'next/link';

interface DashboardCollection {
  id: string;
  contractAddress: string;
  name: string;
  symbol: string;
  coverImage: string | null;
  bannerImage: string | null;
  maxSupply: number;
  mintPrice: string;
  isVerified: boolean;
  description: string | null;
  externalUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
}

interface CollectionStats {
  totalCollections: number;
  totalNFTsMinted: number;
  totalVolume: number;
  totalRoyalties: number;
}

export default function DashboardPage() {
  const { isConnected, address } = useWalletStore();
  const deployedCollections = useCollectionsStore((state) => state.deployedCollections);
  const savedAIDrafts = useAIGenerationStore((state) => state.savedDrafts);
  const setAIDraft = useAIGenerationStore((state) => state.setDraft);
  const [userCollections, setUserCollections] = useState<DashboardCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [stats, setStats] = useState<CollectionStats>({
    totalCollections: 0,
    totalNFTsMinted: 0,
    totalVolume: 0,
    totalRoyalties: 0,
  });

  // Edit modal state
  const [editingCollection, setEditingCollection] = useState<DashboardCollection | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    externalUrl: '',
    twitterUrl: '',
    discordUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!address || !isConnected) return;

    let cancelled = false;

    async function loadUserCollections() {
      setIsLoadingCollections(true);

      let dbCollections: any[] = [];
      try {
        const user = await getUser(address as string);
        if (user) {
          dbCollections = (await getCollections({ creatorId: user.id })) || [];
        }
      } catch (e) {
        console.error('Failed to load dashboard collections from Supabase:', e);
      }

      const fromDb: DashboardCollection[] = dbCollections.map((col) => ({
        id: col.id,
        contractAddress: col.contract_address,
        name: col.name,
        symbol: col.symbol,
        coverImage: col.cover_image_url,
        bannerImage: col.banner_url,
        maxSupply: col.max_supply,
        mintPrice: String(col.mint_price_eth ?? '0'),
        isVerified: !!col.is_verified,
        description: col.description,
        externalUrl: col.external_url,
        twitterUrl: col.twitter_url,
        discordUrl: col.discord_url,
      }));

      // Fallback: same-browser collections that haven't synced to Supabase yet
      const dbAddresses = new Set(fromDb.map((c) => c.contractAddress?.toLowerCase()));
      const localOnly: DashboardCollection[] = deployedCollections
        .filter(
          (col) =>
            col.creatorAddress.toLowerCase() === (address as string).toLowerCase() &&
            !dbAddresses.has(col.contractAddress?.toLowerCase())
        )
        .map((col) => ({
          id: col.id,
          contractAddress: col.contractAddress,
          name: col.name,
          symbol: col.symbol,
          coverImage: col.coverImage,
          bannerImage: col.bannerImage,
          maxSupply: col.maxSupply,
          mintPrice: col.mintPrice,
          isVerified: false,
          description: null,
          externalUrl: null,
          twitterUrl: null,
          discordUrl: null,
        }));

      if (!cancelled) {
        const combined = [...fromDb, ...localOnly];
        setUserCollections(combined);
        setStats({
          totalCollections: combined.length,
          totalNFTsMinted: 0,
          totalVolume: 0,
          totalRoyalties: 0,
        });
        setIsLoadingCollections(false);
      }
    }

    loadUserCollections();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, deployedCollections]);

  const openEditModal = (collection: DashboardCollection) => {
    setEditingCollection(collection);
    setEditForm({
      description: collection.description || '',
      externalUrl: collection.externalUrl || '',
      twitterUrl: collection.twitterUrl || '',
      discordUrl: collection.discordUrl || '',
    });
    setSaveSuccess(false);
  };

  const handleSaveEdit = async () => {
    if (!editingCollection) return;
    setIsSaving(true);
    try {
      await updateCollectionByAddress(editingCollection.contractAddress, {
        description: editForm.description,
        external_url: editForm.externalUrl,
        twitter_url: editForm.twitterUrl,
        discord_url: editForm.discordUrl,
      });

      setUserCollections((prev) =>
        prev.map((c) =>
          c.contractAddress === editingCollection.contractAddress
            ? {
                ...c,
                description: editForm.description,
                externalUrl: editForm.externalUrl,
                twitterUrl: editForm.twitterUrl,
                discordUrl: editForm.discordUrl,
              }
            : c
        )
      );
      setSaveSuccess(true);
      setTimeout(() => setEditingCollection(null), 900);
    } catch (e) {
      console.error('Failed to save collection edits:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 md:gap-3">
              <Crown className="h-6 w-6 md:h-8 md:w-8 text-crown" />
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your collections and track performance
            </p>
          </motion.div>

          {!isConnected ? (
            <Card className="royal-card text-center py-12 md:py-16">
              <CardContent>
                <Crown className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="font-display text-lg md:text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
                  Connect your wallet to view your creator dashboard and manage your collections.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-6 md:mb-8"
              >
                {[
                  { label: 'Collections', value: stats.totalCollections, icon: ImageIcon },
                  { label: 'NFTs Minted', value: stats.totalNFTsMinted, icon: Activity },
                  { label: 'Total Volume', value: stats.totalVolume, icon: TrendingUp },
                  { label: 'Royalties', value: stats.totalRoyalties, icon: DollarSign },
                  { label: 'Collectors', value: 0, icon: Users },
                ].map((stat) => (
                  <Card key={stat.label} className="royal-card">
                    <CardContent className="pt-3 md:pt-4 pb-3 md:pb-4 px-2 md:px-4">
                      <div className="flex flex-col items-center gap-2">
                        <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-crown" />
                        <span className="text-lg md:text-2xl font-bold text-amber-400">
                          {typeof stat.value === 'number' ? stat.value : stat.value}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              {/* Main Content */}
              <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Collections */}
                <div className="lg:col-span-2">
                  <Tabs defaultValue="collections" className="w-full">
                    <TabsList className="mb-3 sm:mb-4 grid w-full grid-cols-2">
                      <TabsTrigger value="collections" className="flex items-center gap-2 text-xs md:text-sm">
                        <ImageIcon className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Collections</span>
                        <span className="sm:hidden">Coll.</span>
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
                        <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                        <span className="sm:hidden">Stats</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="collections">
                      {isLoadingCollections ? (
                        <Card className="royal-card text-center py-8 md:py-12">
                          <CardContent>
                            <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                            <p className="text-muted-foreground text-sm">Loading your collections...</p>
                          </CardContent>
                        </Card>
                      ) : userCollections.length === 0 ? (
                        <Card className="royal-card text-center py-8 md:py-12">
                          <CardContent>
                            <ImageIcon className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4 text-sm md:text-base">No collections yet</p>
                            <Link href="/launchpad">
                              <Button className="bg-amber-500 hover:bg-amber-600 text-white h-9 md:h-10 text-xs md:text-sm">
                                <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                                Create First Collection
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {userCollections.map((collection) => (
                            <Card key={collection.id} className="royal-card overflow-hidden hover:shadow-royal transition-all">
                              <CardContent className="p-3 md:p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                                  {/* Collection Cover */}
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-royal-500/10">
                                    {collection.coverImage ? (
                                      <img
                                        src={collection.coverImage}
                                        alt={collection.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground opacity-50" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Collection Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-display text-base md:text-lg font-bold truncate">{collection.name}</h3>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {collection.symbol}
                                      </Badge>
                                      {collection.isVerified ? (
                                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs flex-shrink-0">
                                          ✓ Verified
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs flex-shrink-0">
                                          Verifying…
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs md:text-sm text-muted-foreground mb-2">
                                      Deployed on Base Chain
                                    </p>
                                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Supply: </span>
                                        <span className="font-semibold text-amber-400">
                                          {collection.maxSupply.toLocaleString()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Price: </span>
                                        <span className="font-semibold text-amber-400">
                                          {collection.mintPrice} ETH
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="royal-border h-8 md:h-9 text-xs md:text-sm"
                                      onClick={() => openEditModal(collection)}
                                    >
                                      <Pencil className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white h-8 md:h-9 text-xs md:text-sm"
                                      asChild
                                    >
                                      <a
                                        href={`https://basescan.org/address/${collection.contractAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        <span className="hidden sm:inline">View</span>
                                        <span className="sm:hidden">Open</span>
                                      </a>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="royal-border h-8 md:h-9 text-xs md:text-sm"
                                      asChild
                                    >
                                      <Link href={`/collections/${collection.contractAddress}`}>
                                        Manage
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="analytics">
                      <Card className="royal-card">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                            <BarChart3 className="h-5 w-5 text-crown" />
                            Performance Overview
                          </CardTitle>
                          <CardDescription className="text-xs md:text-sm">
                            Your collection performance over the last 30 days
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <Activity className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-sm md:text-base">No data available</p>
                              <p className="text-xs md:text-sm mt-2">
                                Create a collection to see analytics
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Activity Feed */}
                <div>
                  {savedAIDrafts.length ? (
                    <Card className="royal-card mb-4 md:mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Package className="h-5 w-5 text-crown" />
                          Saved AI Kits
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                          Continue generated layer kits in the launchpad
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {savedAIDrafts.slice(0, 5).map((draft) => (
                          <div
                            key={draft.createdAt}
                            className="rounded-lg border border-royal-500/30 p-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-royal-500/10">
                                {draft.coverImageUrl || draft.imageUrl ? (
                                  <img
                                    src={draft.coverImageUrl || draft.imageUrl}
                                    alt={draft.collectionName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="m-3 h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{draft.collectionName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {draft.generatorLayers?.length || 0} layers
                                </p>
                              </div>
                            </div>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="royal-border mt-2 w-full"
                              onClick={() => setAIDraft(draft)}
                            >
                              <Link href="/launchpad">Use in Launchpad</Link>
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}

                  <Card className="royal-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <Activity className="h-5 w-5 text-crown" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        Real-time updates from your collections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="py-6 md:py-8 text-center text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Edit Collection Modal */}
      <Dialog open={!!editingCollection} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent className="royal-card">
          <DialogHeader>
            <DialogTitle>Edit {editingCollection?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              On-chain fields (name, symbol, max supply) can&apos;t change after deployment.
              Mint price, base URI, and mint window can be updated via your contract&apos;s
              owner functions on the Manage page. This edits the collection&apos;s public listing info.
            </p>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Tell collectors about this collection..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external-url">Website</Label>
              <Input
                id="edit-external-url"
                value={editForm.externalUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, externalUrl: e.target.value }))}
                placeholder="https://yourproject.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-twitter-url">Twitter / X</Label>
              <Input
                id="edit-twitter-url"
                value={editForm.twitterUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, twitterUrl: e.target.value }))}
                placeholder="https://x.com/yourhandle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discord-url">Discord</Label>
              <Input
                id="edit-discord-url"
                value={editForm.discordUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, discordUrl: e.target.value }))}
                placeholder="https://discord.gg/yourinvite"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCollection(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              {saveSuccess ? 'Saved' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
