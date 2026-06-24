import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

// WalletConnect Project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '640098d539b978eeada4a17a96770f3c';

export const config = getDefaultConfig({
  appName: 'House of Joshi',
  projectId,
  chains: [base, baseSepolia],
  ssr: true,
});
