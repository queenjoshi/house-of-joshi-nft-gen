'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  deepLink: (url: string) => string;
  downloadUrl: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    deepLink: (url) => `https://metamask.app.link/dapp/${url}`,
    downloadUrl: 'https://metamask.io',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🔷',
    deepLink: (url) => `trust://browser_enable?url=${encodeURIComponent(url)}`,
    downloadUrl: 'https://trustwallet.com',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '◎',
    deepLink: (url) => `https://go.cb-w.com/dapp?url=${encodeURIComponent(url)}`,
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    deepLink: (url) => `https://rnbw.me/connect/${url}`,
    downloadUrl: 'https://rainbow.me',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    deepLink: (url) => `https://cloud.walletconnect.com/app?projectId=${process.env.NEXT_PUBLIC_REOWN_PROJECT_ID}`,
    downloadUrl: 'https://walletconnect.com',
  },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [copied, setCopied] = useState(false);
  const host = typeof window !== 'undefined' ? window.location.host : '';

  const handleWalletClick = (wallet: WalletOption) => {
    try {
      const url = wallet.deepLink(host);
      
      // Check if it's a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      if (isMobile) {
        // On mobile, redirect to the deep link
        window.location.href = url;
      } else {
        // On desktop, try to open in new tab/window
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // If popup is blocked, redirect
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(host);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletClick(wallet)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-royal-500/30 hover:bg-royal-500/10 hover:border-gold-500/50 transition-all duration-200 group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {wallet.icon}
                </span>
                <span className="text-sm font-medium text-center">{wallet.name}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-royal-500/20" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-royal-500/20" />
          </div>

          {/* Manual Connection Info */}
          <div className="bg-royal-500/10 border border-royal-500/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have a wallet? Download one from the options above.
            </p>
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded border border-royal-500/20">
              <code className="text-xs flex-1 break-all text-gold-500">{host}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyAddress}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-muted-foreground text-center">
            🔒 Your private keys are secure. This site does not have access to them.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
