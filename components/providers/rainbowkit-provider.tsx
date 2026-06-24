'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function RainbowKitProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            theme === 'dark'
              ? darkTheme({
                  accentColor: '#FFD700',
                  accentColorForeground: '#1a0a2e',
                  borderRadius: 'medium',
                })
              : lightTheme({
                  accentColor: '#FFD700',
                  accentColorForeground: '#1a0a2e',
                  borderRadius: 'medium',
                })
          }
          showRecentTransactions={true}
          modalSize="wide"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
