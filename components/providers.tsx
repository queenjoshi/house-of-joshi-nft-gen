'use client';

import { ThemeProvider } from 'next-themes';
import { RainbowKitProviders } from './providers/rainbowkit-provider';
import { ServiceWorkerRegistration } from './service-worker-registration';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <RainbowKitProviders>
        <ServiceWorkerRegistration />
        {children}
      </RainbowKitProviders>
    </ThemeProvider>
  );
}
