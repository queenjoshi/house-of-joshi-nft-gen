'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWalletStore } from '@/lib/store';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  downloadUrl: string;
  deepLink?: (origin: string) => string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io',
    deepLink: (origin) => `https://metamask.app.link/dapp/${origin.replace(/^https?:\/\//, '')}`,
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    icon: '🐰',
    downloadUrl: 'https://rabby.io',
    deepLink: (origin) => `https://app.rabby.io?dapp=${encodeURIComponent(origin)}`,
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🔷',
    downloadUrl: 'https://trustwallet.com',
    deepLink: (origin) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(origin)}`,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '◎',
    downloadUrl: 'https://www.coinbase.com/wallet',
    deepLink: (origin) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(origin)}`,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    downloadUrl: 'https://rainbow.me',
    deepLink: (origin) => `https://rnbw.to/dapp?url=${encodeURIComponent(origin)}`,
  },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const { setAddress, setChainId } = useWalletStore();

  useEffect(() => {
    // Listen for wallet connection events
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [setAddress, setChainId]);

  const handleConnectWallet = async (walletId: string) => {
    setConnecting(true);
    setError('');

    try {
      if (typeof window === 'undefined') return;

      const ethereum = (window as any).ethereum;
      const wallet = WALLET_OPTIONS.find((w) => w.id === walletId);

      if (!ethereum) {
        // Wallet not installed, try deep link on mobile first
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile && wallet?.deepLink) {
          // Try deep link to mobile wallet
          const origin = window.location.origin;
          const deepLinkUrl = wallet.deepLink(origin);
          window.location.href = deepLinkUrl;
          
          // Fallback to download after a delay if deep link doesn't work
          setTimeout(() => {
            if (wallet) {
              window.open(wallet.downloadUrl, '_blank');
            }
          }, 3000);
        } else if (wallet) {
          // Desktop or no deep link available - open download URL
          window.open(wallet.downloadUrl, '_blank');
        }
        
        setError('Wallet not installed. Opening download link...');
        setConnecting(false);
        return;
      }

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        // Get chain ID
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        
        // Save to store
        setAddress(accounts[0]);
        setChainId(parseInt(chainIdHex, 16));

        // Close modal on success
        onClose();
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyDomain = () => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
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
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Wallet Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnectWallet(wallet.id)}
                disabled={connecting}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-royal-500/30 hover:bg-royal-500/10 hover:border-gold-500/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                ) : (
                  <>
                    <span className="text-4xl group-hover:scale-110 transition-transform group-disabled:scale-100">
                      {wallet.icon}
                    </span>
                    <span className="text-sm font-medium text-center">{wallet.name}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Info Section */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Don't have a wallet installed?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_OPTIONS.map((wallet) => (
                  <Button
                    key={`download-${wallet.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(wallet.downloadUrl, '_blank')}
                    className="text-xs h-8 royal-border"
                  >
                    Get {wallet.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-royal-500/20" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-royal-500/20" />
            </div>

            {/* Site Info */}
            <div className="bg-royal-500/10 border border-royal-500/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">This site:</p>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded border border-royal-500/20">
                <code className="text-xs flex-1 break-all text-gold-500">
                  {typeof window !== 'undefined' ? window.location.origin : 'thehouseofjoshi.com'}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyDomain}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-muted-foreground text-center">
            🔒 Your private keys are secure. Never share your seed phrase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
