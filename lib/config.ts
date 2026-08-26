const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Contract addresses are network-specific. Base uses the verified HOJNFTGen
// deployment as its fallback; Base Sepolia must be explicitly configured.
export const FACTORY_ADDRESSES = {
  8453: (process.env.NEXT_PUBLIC_HOJ_FACTORY_BASE
    || '0x303c77cDAf1C6799533D9cD234C05633Ce476467') as `0x${string}`,
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
  DREAMWEAVER: (process.env.NEXT_PUBLIC_DREAMWEAVER_CONTRACT
    || '0xd426105F39C8B0d192496e8aBfaD4a2D7686a8E6') as `0x${string}`,
  DREAMWEAVER_SIGNER: (process.env.NEXT_PUBLIC_DREAMWEAVER_SIGNER_ADDRESS
    || '0x769c118906c7E25d3cdfd943ce9a0B8Aab56eFeE') as `0x${string}`,
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
