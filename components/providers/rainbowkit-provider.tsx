'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { config } from '@/lib/wagmi';
import { WalletErrorBoundary } from './wallet-error-boundary';
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Custom theme configuration matching House of Joshi royal aesthetic
const customDarkTheme = darkTheme({
  accentColor: '#FFD700',
  accentColorForeground: '#1a0a2e',
  borderRadius: 'large',
  fontStack: 'system',
});

const customLightTheme = lightTheme({
  accentColor: '#FFD700',
  accentColorForeground: '#1a0a2e',
  borderRadius: 'large',
  fontStack: 'system',
});

// Analytics tracking for wallet events
const trackWalletEvent = (event: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      event_category: 'wallet',
      ...data,
    });
  }
  
  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Wallet Analytics] ${event}`, data);
  }
};

function WalletAnalyticsTracker() {
  const { isConnected, address, chainId } = useAccount();
  const wasConnected = useRef(false);

  useEffect(() => {
    // Track connection
    if (isConnected && !wasConnected.current) {
      trackWalletEvent('wallet_connected', {
        address: address?.slice(0, 6),
        chainId,
      });
      wasConnected.current = true;
    }
    
    // Track disconnection
    if (!isConnected && wasConnected.current) {
      trackWalletEvent('wallet_disconnected');
      wasConnected.current = false;
    }
  }, [isConnected, address, chainId]);

  return null;
}

export function RainbowKitProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletErrorBoundary>
          <RainbowKitProvider
            theme={theme === 'dark' ? customDarkTheme : customLightTheme}
            showRecentTransactions={true}
            modalSize="wide"
            coolMode
          >
            <WalletAnalyticsTracker />
            {children}
          </RainbowKitProvider>
        </WalletErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
