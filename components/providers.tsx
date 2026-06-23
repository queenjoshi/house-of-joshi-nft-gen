'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, mainnet, sepolia } from '@reown/appkit/networks';
import { ServiceWorkerRegistration } from './service-worker-registration';

// Initialize Reown AppKit in a ref so it can be accessed globally
let appKitInstance: any = null;

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

export const initializeReownAppKit = (themeMode: string = 'dark') => {
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
        icons: ['https://thehouseofjoshi.com/joshi-logo.png'],
      },
      features: {
        analytics: true,
        allWallets: true,
        socials: false,
      },
      themeMode: themeMode as any,
      themeVariables: {
        '--w3m-color-mix': '#6E44FF',
        '--w3m-color-mix-strength': 40,
      },
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

function ProvidersInner({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme } = useTheme();
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

  // Initialize AppKit on client side with current theme
  useEffect(() => {
    if (projectId) {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      initializeReownAppKit(currentTheme || 'dark');
    }
  }, [theme, systemTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      {children}
    </QueryClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ProvidersInner>{children}</ProvidersInner>
    </ThemeProvider>
  );
}
