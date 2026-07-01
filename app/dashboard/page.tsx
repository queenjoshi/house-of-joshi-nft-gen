'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  TrendingUp,
  Users,
  DollarSign,
  Image,
  BarChart3,
  Activity,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, useCollectionsStore } from '@/lib/store';
import Link from 'next/link';

interface CollectionStats {
  totalCollections: number;
  totalNFTsMinted: number;
  totalVolume: number;
  totalRoyalties: number;
}

export default function DashboardPage() {
  const { isConnected, address } = useWalletStore();
  const deployedCollections = useCollectionsStore((state) => state.deployedCollections);
  const [userCollections, setUserCollections] = useState<typeof deployedCollections>([]);
  const [stats, setStats] = useState<CollectionStats>({
    totalCollections: 0,
    totalNFTsMinted: 0,
    totalVolume: 0,
    totalRoyalties: 0,
  });

  useEffect(() => {
    if (!address || !isConnected) return;

    console.log('Dashboard - deployedCollections:', deployedCollections);
    console.log('Dashboard - address:', address);

    // Filter collections created by the current user
    const myCollections = deployedCollections.filter(
      (col) => col.creatorAddress.toLowerCase() === address.toLowerCase()
    );

    console.log('Dashboard - myCollections:', myCollections);
    setUserCollections(myCollections);

    // Calculate stats
    const collectionStats: CollectionStats = {
      totalCollections: myCollections.length,
      totalNFTsMinted: 0, // Will be calculated from contract
      totalVolume: 0, // Will be calculated from contract
      totalRoyalties: 0, // Will be calculated from contract
    };

    setStats(collectionStats);
  }, [address, isConnected, deployedCollections]);

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
                  { label: 'Collections', value: stats.totalCollections, icon: Image },
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
                        <Image className="h-3 w-3 md:h-4 md:w-4" />
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
                      {userCollections.length === 0 ? (
                        <Card className="royal-card text-center py-8 md:py-12">
                          <CardContent>
                            <Image className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-4 text-muted-foreground" />
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
                                        <Image className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground opacity-50" />
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

      <Footer />
    </div>
  );
}
