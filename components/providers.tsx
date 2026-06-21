'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, mainnet, sepolia } from '@reown/appkit/networks';

// Initialize Reown AppKit in a ref so it can be accessed globally
let appKitInstance: any = null;

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

export const initializeReownAppKit = () => {
  if (typeof window === 'undefined' || appKitInstance) return;
  
  try {
    if (!projectId) {
      console.error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set');
      return null;
    }

    const ethersAdapter = new EthersAdapter();
    
    const appKit = createAppKit({
      adapters: [ethersAdapter],
      networks: [base, mainnet, sepolia] as any,
      projectId,
      metadata: {
        name: 'House of Joshi',
        description: 'Create & Launch NFT Collections on Base',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://thehouseofjoshi.com',
        icons: ['/joshi-logo.png'],
      },
      features: {
        analytics: true,
        allWallets: true,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-color-mix': '#d4a574',
        '--w3m-color-mix-strength': 40,
      },
      enableMobileWalletLink: true,
    });
    
    appKitInstance = appKit;
    // Expose globally for access
    (window as any).reownAppKit = appKit;
    
    console.log('Reown AppKit initialized successfully');
    return appKit;
  } catch (error) {
    console.error('Failed to initialize Reown AppKit:', error);
    return null;
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Initialize AppKit on client side
  useEffect(() => {
    if (projectId) {
      initializeReownAppKit();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
