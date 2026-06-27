'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  Compass,
  Users,
  Menu,
  X,
  Sun,
  Moon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore, isBaseNetwork, BASE_MAINNET, BASE_SEPOLIA } from '@/lib/store';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { toast } from 'sonner';

// Lazy load RainbowKit ConnectButton for better bundle size
const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { ssr: false, loading: () => <div className="h-9 w-24 animate-pulse bg-muted rounded-md" /> }
);

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/collections', label: 'Collections', icon: Compass },
  { href: '/launchpad', label: 'Launchpad', icon: Sparkles },
  { href: '/referral', label: 'Referral', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track wallet connection changes for toast notifications
  useEffect(() => {
    if (isConnected && !wasConnected) {
      toast.success('Wallet Connected', {
        description: `Connected to ${chainId === BASE_MAINNET.id ? 'Base Mainnet' : chainId === BASE_SEPOLIA.id ? 'Base Sepolia' : 'Unknown Network'}`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
      setWasConnected(true);
    } else if (!isConnected && wasConnected) {
      toast.info('Wallet Disconnected', {
        icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      });
      setWasConnected(false);
    }
  }, [isConnected, chainId, wasConnected]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = isBaseNetwork(chainId ?? null);

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    try {
      await switchChain({ chainId: BASE_MAINNET.id });
      toast.success('Network Switched', {
        description: 'Switched to Base Mainnet',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      toast.error('Network Switch Failed', {
        description: 'Failed to switch to Base Mainnet',
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return (
    <header className="z-50 w-full border-b border-royal-500/20 bg-background/80 backdrop-blur-xl sticky top-0">
      <div className="container flex h-14 sm:h-16 items-center gap-2 px-3 sm:px-4 md:gap-4">
        {/* Mobile Menu Toggle - Left */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden flex-shrink-0"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Navigation - Center (Horizontal Scroll) */}
        <nav className="flex items-center gap-4 flex-1 overflow-x-auto hide-scrollbar-mobile md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium text-xs whitespace-nowrap flex-shrink-0"
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logo - Hidden on Mobile, Left on Desktop */}
        <Link href="/" className="hidden md:flex items-center gap-2 group flex-shrink-0 md:mr-auto">
          <div className="relative flex items-center justify-center">
            <Image 
              src="/joshi-logo.png" 
              alt="Joshi Logo" 
              width={40}
              height={40}
              className="h-8 w-8 md:h-10 md:w-10 animate-crown-shine"
            />
            <div className="absolute inset-0 bg-crown/20 blur-xl rounded-full" />
          </div>
          <span className="font-display text-lg md:text-2xl font-bold gold-text whitespace-nowrap">
            House of Joshi
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="hidden md:flex items-center justify-center gap-6 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3 justify-end flex-shrink-0">
          {/* Theme Toggle - Desktop Only */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative overflow-hidden h-8 w-8 md:h-11 md:w-11 hidden md:flex"
            >
              <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Network Indicator - Desktop Only */}
          {isConnected && !isCorrectNetwork && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs h-8 md:h-10 px-2 md:px-3 hidden lg:inline-flex gap-2"
              onClick={handleSwitchNetwork}
              disabled={isSwitchingNetwork}
            >
              {isSwitchingNetwork ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Switching...
                </>
              ) : (
                'Switch to Base'
              )}
            </Button>
          )}

          {/* RainbowKit Connect Button - Desktop */}
          <div className="hidden md:block">
            <ConnectButton />
          </div>

          {/* RainbowKit Connect Button - Mobile (Corner) */}
          <div className="md:hidden scale-75 origin-right flex-shrink-0">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-royal-500/20 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container px-3 sm:px-4 py-3 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-royal-500/10 transition-colors text-sm"
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}

              {/* Theme Toggle - Mobile */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-royal-500/10 transition-colors text-sm w-full text-left"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <Moon className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="font-medium">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              )}

              {/* Network Switch - Mobile */}
              {isConnected && !isCorrectNetwork && (
                <button
                  onClick={handleSwitchNetwork}
                  disabled={isSwitchingNetwork}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {isSwitchingNetwork ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <span className="font-medium">
                    {isSwitchingNetwork ? 'Switching...' : 'Switch to Base'}
                  </span>
                </button>
              )}

              {/* Connect Wallet - Mobile */}
              <div className="px-4 py-3">
                <ConnectButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
