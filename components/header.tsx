'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Menu,
  X,
  Sun,
  Moon,
  Wallet,
  Sparkles,
  LayoutDashboard,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletStore, useUIStore, isBaseNetwork, BASE_MAINNET, BASE_SEPOLIA } from '@/lib/store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/collections', label: 'Collections', icon: Compass },
  { href: '/launchpad', label: 'Launchpad', icon: Sparkles },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { address, chainId, isConnected, disconnect } = useWalletStore();
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts[0]) {
          const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
          useWalletStore.getState().setAddress(accounts[0]);
          useWalletStore.getState().setChainId(parseInt(chainIdHex, 16));
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = isBaseNetwork(chainId);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-royal-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center">
            <img 
              src="/joshi-logo.png" 
              alt="Joshi Logo" 
              className="h-8 w-8 animate-crown-shine"
            />
            <div className="absolute inset-0 bg-crown/20 blur-xl rounded-full" />
          </div>
          <span className="font-display text-2xl font-bold gold-text hidden sm:inline">
            House of Joshi
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative overflow-hidden"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Network Indicator */}
          {isConnected && !isCorrectNetwork && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                  (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${BASE_MAINNET.id.toString(16)}` }],
                  }).catch(async (err: any) => {
                    if (err.code === 4902) {
                      await (window as any).ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BASE_MAINNET],
                      });
                    }
                  });
                }
              }}
            >
              Switch to Base
            </Button>
          )}

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="gold-button"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn(
                  "border-gold-500/50 hover:border-gold-400 transition-colors",
                  !isCorrectNetwork && "border-destructive hover:border-destructive"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    isCorrectNetwork ? "bg-green-500" : "bg-destructive"
                  )} />
                  {formatAddress(address!)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 royal-card">
                <DropdownMenuItem className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Network:</span>
                  <span className={cn(
                    "text-xs",
                    isCorrectNetwork ? "text-green-500" : "text-destructive"
                  )}>
                    {chainId === BASE_MAINNET.id ? 'Base Mainnet' : chainId === BASE_SEPOLIA.id ? 'Base Sepolia' : 'Unsupported'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-royal-500/20" />
                <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive">
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-royal-500/20"
          >
            <nav className="container px-4 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-royal-500/10 transition-colors"
                >
                  <link.icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
