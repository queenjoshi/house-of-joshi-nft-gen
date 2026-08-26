const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Contract addresses are network-specific. Base keeps the legacy deployment as
// a fallback; Base Sepolia must be explicitly configured after deployment.
export const FACTORY_ADDRESSES = {
  8453: (process.env.NEXT_PUBLIC_HOJ_FACTORY_BASE
    || '0x81B85DbfF8962EBd4CF610EaDD5398913B0405c1') as `0x${string}`,
  84532: (process.env.NEXT_PUBLIC_HOJ_FACTORY_BASE_SEPOLIA
    || ZERO_ADDRESS) as `0x${string}`,
} as const;

export function getFactoryAddress(chainId?: number | null) {
  if (chainId !== 8453 && chainId !== 84532) return null;
  const address = FACTORY_ADDRESSES[chainId];
  return address === ZERO_ADDRESS ? null : address;
}

// Backwards-compatible mainnet contract reference.
export const CONTRACTS = {
  FACTORY: FACTORY_ADDRESSES[8453],
};

// Network Configuration
export const NETWORKS = {
  BASE: {
    id: 8453,
    name: 'Base',
    rpc: 'https://mainnet.base.org',
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
  },
};

// App Configuration
export const APP_CONFIG = {
  name: 'House of Joshi Launchpad',
  description: 'Create, launch, and mint generative NFT collections on Base',
  url: 'https://royalmint.app',
  logo: '/joshi-logo.png',
  social: {
    email: 'support@thehouseofjoshi.com',
    twitter: 'https://twitter.com/thehouseofjoshi',
    discord: 'https://discord.com/invite/uH9zVeAwDu',
    instagram: 'https://www.instagram.com/thehouseofjoshi',
  },
};
