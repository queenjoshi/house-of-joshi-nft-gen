'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Share2,
  Users,
  Zap,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useWalletStore, useReferralStore } from '@/lib/store';
import Link from 'next/link';

export default function ReferralPage() {
  const { isConnected, address } = useWalletStore();
  const { referralCode, generateReferralCode, referralRewards, referralCount } = useReferralStore();
  const [copied, setCopied] = useState(false);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');

  useEffect(() => {
    if (address && isConnected) {
      const code = generateReferralCode(address);
      setMyCode(code);
      setReferralLink(`${window.location.origin}/ref/${code}`);
    }
  }, [address, isConnected, generateReferralCode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `Join me on House of Joshi Launchpad using my referral code: ${myCode}\n\nEarn rewards when your friends deploy collections!\n\nhttps://thehouseofjoshi.com/ref/${myCode}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const shareOnDiscord = () => {
    const text = `🎉 Join House of Joshi Launchpad with my referral code: **${myCode}**\n\nEarn rewards when your friends deploy collections!\n\nLink: ${referralLink}`;
    // Copy to clipboard as fallback since Discord doesn't have direct share
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 md:py-8">
        <div className="container px-4 max-w-4xl mx-auto">
          {!isConnected ? (
            <Card className="royal-card text-center py-12 md:py-16">
              <CardContent>
                <Users className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="font-display text-lg md:text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 text-sm md:text-base">
                  Connect your wallet to generate your unique referral code and start earning rewards.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Header */}
              <div className="mb-6 md:mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 md:mb-3">Referral Program</h1>
                <p className="text-muted-foreground text-sm md:text-lg">
                  Earn rewards by referring friends to House of Joshi Launchpad.
                  Get 5% of every collection deployment fee from your referrals.
                </p>
              </div>

              {/* Referral Code Card */}
              <Card className="royal-card border-crown/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Zap className="h-4 md:h-5 w-4 md:w-5 text-crown" />
                    Your Referral Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  {myCode ? (
                    <>
                      <div className="bg-royal-500/10 p-4 md:p-6 rounded-lg border border-royal-500/30 text-center">
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">Your Unique Code</p>
                        <p className="text-3xl md:text-4xl font-display font-bold text-crown mb-3 md:mb-4 break-all">{myCode}</p>
                        <Button
                          onClick={() => handleCopy(myCode)}
                          className="bg-amber-500 hover:bg-amber-600 text-white w-full md:w-auto h-9 md:h-10 text-xs md:text-sm"
                        >
                          {copied ? <Check className="mr-2 h-3 md:h-4 w-3 md:w-4" /> : <Copy className="mr-2 h-3 md:h-4 w-3 md:w-4" />}
                          {copied ? 'Copied!' : 'Copy Code'}
                        </Button>
                      </div>

                      <div className="bg-royal-500/10 p-4 md:p-6 rounded-lg border border-royal-500/30">
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">Your Referral Link</p>
                        <p className="text-xs md:text-sm font-mono text-crown break-all mb-3 md:mb-4">{referralLink}</p>
                        <Button
                          onClick={() => handleCopy(referralLink)}
                          className="w-full gold-button h-9 md:h-10 text-xs md:text-sm"
                        >
                          {copied ? <Check className="mr-2 h-3 md:h-4 w-3 md:w-4" /> : <Copy className="mr-2 h-3 md:h-4 w-3 md:w-4" />}
                          {copied ? 'Link Copied!' : 'Copy Link'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 md:py-8">
                      <p className="text-muted-foreground text-sm">Generating your referral code...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Buttons */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Share2 className="h-4 md:h-5 w-4 md:w-5 text-crown" />
                    Share Your Referral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-3">
                  <Button
                    onClick={shareOnTwitter}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9 md:h-10 text-xs md:text-sm"
                  >
                    Share on Twitter/X
                  </Button>
                  <Button
                    onClick={shareOnDiscord}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-9 md:h-10 text-xs md:text-sm"
                  >
                    Share on Discord
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Card className="royal-card">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Users className="h-3 md:h-4 w-3 md:w-4 text-crown" />
                      Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold text-crown">{referralCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Collections deployed</p>
                  </CardContent>
                </Card>

                <Card className="royal-card">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <TrendingUp className="h-3 md:h-4 w-3 md:w-4 text-crown" />
                      Rewards Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold text-crown break-all">{referralRewards.toFixed(4)} ETH</p>
                    <p className="text-xs text-muted-foreground mt-1">5% of deployments</p>
                  </CardContent>
                </Card>
              </div>

              {/* How It Works */}
              <Card className="royal-card">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">How It Works</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Simple steps to earn rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="flex gap-3 md:gap-4">
                    <Badge className="h-7 md:h-8 w-7 md:w-8 flex items-center justify-center rounded-full flex-shrink-0 bg-crown text-black text-xs md:text-sm">
                      1
                    </Badge>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">Share Your Code</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Share your unique referral code or link with friends
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:gap-4">
                    <Badge className="h-7 md:h-8 w-7 md:w-8 flex items-center justify-center rounded-full flex-shrink-0 bg-crown text-black text-xs md:text-sm">
                      2
                    </Badge>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">They Deploy Collections</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Friends use your code when deploying NFT collections on the launchpad
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:gap-4">
                    <Badge className="h-7 md:h-8 w-7 md:w-8 flex items-center justify-center rounded-full flex-shrink-0 bg-crown text-black text-xs md:text-sm">
                      3
                    </Badge>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">Earn 5% Rewards</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Get 5% of their deployment fees directly to your wallet
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:gap-4">
                    <Badge className="h-7 md:h-8 w-7 md:w-8 flex items-center justify-center rounded-full flex-shrink-0 bg-crown text-black text-xs md:text-sm">
                      4
                    </Badge>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">Withdraw Anytime</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Withdraw your earned rewards directly to your wallet
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center py-6 md:py-8">
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
                  Ready to start deploying? Check out the launchpad.
                </p>
                <Link href="/launchpad">
                  <Button className="gold-button h-9 md:h-10 text-sm md:text-base">
                    Go to Launchpad
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
