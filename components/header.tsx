'use client';

import Link from 'next/link';
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
  Wallet,
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
import { useReownModal } from '@/hooks/useReownModal';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/collections', label: 'Collections', icon: Compass },
  { href: '/launchpad', label: 'Launchpad', icon: Sparkles },
  { href: '/referral', label: 'Referral', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { address, chainId, isConnected, disconnect: disconnectStore, setAddress, setChainId } = useWalletStore();
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();
  const { openModal, disconnect: disconnectReown, getAddress, getChainId, isReady } = useReownModal();
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync Reown wallet state with store
  useEffect(() => {
    if (!isReady) return;

    const checkConnection = async () => {
      const addr = getAddress();
      const chain = getChainId();
      
      if (addr && chain) {
        setAddress(addr);
        setChainId(chain);
      }
    };

    checkConnection();

    // Set up interval to check connection state
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, [isReady, getAddress, getChainId, setAddress, setChainId]);

  const isInAppBrowser = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Check for common in-app browsers
    const inAppBrowsers = [
      'FBAN',      // Facebook
      'FBAV',      // Facebook
      'Twitter',   // Twitter/X
      'Line',      // Line
      'Instagram', // Instagram
      'MicroMessenger', // WeChat
      'WhatsApp',  // WhatsApp
      'Telegram',  // Telegram
      'Viber',     // Viber
      'Snapchat',  // Snapchat
      'LinkedIn',  // LinkedIn
      'Slack',     // Slack
      'Discord',   // Discord
    ];
    
    return inAppBrowsers.some(browser => ua.includes(browser));
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if user is in an in-app browser
      if (isInAppBrowser()) {
        alert(
          'For the best wallet connection experience, please open this page in your device\'s default browser (Chrome, Safari, etc.)\n\n' +
          'In-app browsers may not support wallet app connections properly.'
        );
      }
      openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectReown();
      disconnectStore();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = isBaseNetwork(chainId);

  return (
    <header className="z-50 w-full border-b border-royal-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-2 px-4 md:gap-4">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative flex items-center justify-center">
            <img 
              src="/joshi-logo.png" 
              alt="Joshi Logo" 
              className="h-8 w-8 md:h-10 md:w-10 animate-crown-shine"
            />
            <div className="absolute inset-0 bg-crown/20 blur-xl rounded-full" />
          </div>
          <span className="font-display text-lg md:text-2xl font-bold gold-text whitespace-nowrap hidden sm:inline">
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
        <div className="flex items-center gap-1 md:gap-3 justify-end flex-shrink-0">
          {/* Theme Toggle - Desktop Only */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative overflow-hidden h-9 w-9 md:h-11 md:w-11 hidden md:flex"
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
              className="text-xs h-9 md:h-10 px-2 md:px-3 hidden lg:inline-flex"
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
              className="gold-button h-9 md:h-11 px-2 md:px-4 text-xs md:text-base whitespace-nowrap"
              size="sm"
            >
              <Wallet className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : 'Connect'}</span>
              <span className="sm:hidden">{isConnecting ? '...' : 'Connect'}</span>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn(
                  "border-gold-500/50 hover:border-gold-400 transition-colors h-9 md:h-11 px-2 md:px-4 text-xs md:text-sm",
                  !isCorrectNetwork && "border-destructive hover:border-destructive"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-1 md:mr-2 flex-shrink-0",
                    isCorrectNetwork ? "bg-green-500" : "bg-destructive"
                  )} />
                  <span className="hidden sm:inline">{formatAddress(address!)}</span>
                  <span className="sm:hidden text-xs">{address?.slice(0, 4)}...</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 md:w-56 royal-card">
                <DropdownMenuItem className="flex items-center gap-2 text-xs md:text-sm">
                  <span className="text-xs text-muted-foreground">Network:</span>
                  <span className={cn(
                    "text-xs",
                    isCorrectNetwork ? "text-green-500" : "text-destructive"
                  )}>
                    {chainId === BASE_MAINNET.id ? 'Base Mainnet' : chainId === BASE_SEPOLIA.id ? 'Base Sepolia' : 'Unsupported'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-royal-500/20" />
                <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive text-xs md:text-sm">
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
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
            <nav className="container px-4 py-3 flex flex-col gap-2">
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
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors text-sm w-full text-left"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                  </div>
                  <span className="font-medium">Switch to Base</span>
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
