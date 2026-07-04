import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection, Layer, Trait, NFT, User } from './types';

// Wallet Store
interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setConnecting: (isConnecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      chainId: null,
      isConnecting: false,
      isConnected: false,
      setAddress: (address) => set({ address, isConnected: !!address }),
      setChainId: (chainId) => set({ chainId }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      disconnect: () => set({ address: null, chainId: null, isConnected: false }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({ 
        address: state.address,
        isConnected: state.isConnected,
        chainId: state.chainId,
      }),
    }
  )
);

// User Store
interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Collection Generator Store
interface GeneratorState {
  collection: Partial<Collection> | null;
  layers: Layer[];
  traits: Record<string, Trait[]>;
  generatedNFTs: NFT[];
  isGenerating: boolean;
  generationProgress: number;
  setCollection: (collection: Partial<Collection> | null) => void;
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  setTraits: (layerId: string, traits: Trait[]) => void;
  addTrait: (layerId: string, trait: Trait) => void;
  removeTrait: (layerId: string, traitId: string) => void;
  setGeneratedNFTs: (nfts: NFT[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  reset: () => void;
}

export const useGeneratorStore = create<GeneratorState>()((set, get) => ({
  collection: null,
  layers: [],
  traits: {},
  generatedNFTs: [],
  isGenerating: false,
  generationProgress: 0,
  setCollection: (collection) => set({ collection }),
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layerId) => set((state) => ({
    layers: state.layers.filter((l) => l.id !== layerId),
    traits: Object.fromEntries(
      Object.entries(state.traits).filter(([id]) => id !== layerId)
    ),
  })),
  setTraits: (layerId, traits) => set((state) => ({
    traits: { ...state.traits, [layerId]: traits },
  })),
  addTrait: (layerId, trait) => set((state) => ({
    traits: {
      ...state.traits,
      [layerId]: [...(state.traits[layerId] || []), trait],
    },
  })),
  removeTrait: (layerId, traitId) => set((state) => ({
    traits: {
      ...state.traits,
      [layerId]: (state.traits[layerId] || []).filter((t) => t.id !== traitId),
    },
  })),
  setGeneratedNFTs: (nfts) => set({ generatedNFTs: nfts }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  reset: () => set({
    collection: null,
    layers: [],
    traits: {},
    generatedNFTs: [],
    isGenerating: false,
    generationProgress: 0,
  }),
}));

// Collections Store - Tracks deployed collections
interface DeployedCollection {
  id: string;
  contractAddress: string;
  name: string;
  symbol: string;
  coverImage: string | null;
  bannerImage: string | null;
  maxSupply: number;
  mintPrice: string;
  creatorAddress: string;
  deployedAt: number; // timestamp
  txHash: string;
}

interface CollectionsState {
  deployedCollections: DeployedCollection[];
  addDeployedCollection: (collection: DeployedCollection) => void;
  getCollectionsByCreator: (creatorAddress: string) => DeployedCollection[];
  getAllCollections: () => DeployedCollection[];
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      deployedCollections: [],
      addDeployedCollection: (collection) => {
        set((state) => {
          const updated = [...state.deployedCollections, collection];
          console.log('Collections store updated:', updated);
          console.log('Collections count:', updated.length);
          return { deployedCollections: updated };
        });
      },
      getCollectionsByCreator: (creatorAddress) => {
        const state = get();
        return state.deployedCollections.filter(
          (c) => c.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
        );
      },
      getAllCollections: () => {
        const state = get();
        console.log('getAllCollections called, returning:', state.deployedCollections);
        return state.deployedCollections;
      },
    }),
    {
      name: 'collections-storage',
      partialize: (state) => ({ deployedCollections: state.deployedCollections }),
      onRehydrateStorage: () => (state) => {
        console.log('Collections store rehydrating...', state);
        if (state) {
          console.log('Rehydrated collections:', state.deployedCollections);
        }
      },
    }
  )
);

// Application UI Store
interface UIState {
  isMobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      theme: 'dark',
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Referral Store
interface ReferralState {
  referralCode: string | null;
  referralLink: string | null;
  referralRewards: number;
  referralCount: number;
  setReferralCode: (code: string) => void;
  setReferralRewards: (rewards: number) => void;
  setReferralCount: (count: number) => void;
  generateReferralCode: (address: string) => string;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: null,
      referralLink: null,
      referralRewards: 0,
      referralCount: 0,
      setReferralCode: (code) => set({ referralCode: code }),
      setReferralRewards: (rewards) => set({ referralRewards: rewards }),
      setReferralCount: (count) => set({ referralCount: count }),
      generateReferralCode: (address: string) => {
        // Generate referral code from wallet address (first 8 chars + last 4 chars)
        const code = (address.slice(2, 8) + address.slice(-4)).toUpperCase();
        set({ referralCode: code, referralLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${code}` });
        return code;
      },
    }),
    {
      name: 'referral-storage',
      partialize: (state) => ({ 
        referralCode: state.referralCode,
        referralRewards: state.referralRewards,
        referralCount: state.referralCount,
      }),
    }
  )
);

// Base Network Configuration
export const BASE_MAINNET = {
  id: 8453,
  name: 'Base',
  network: 'base-mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorerUrls: ['https://basescan.org'],
};

export const BASE_SEPOLIA = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
 nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
  blockExplorerUrls: ['https://sepolia.basescan.org'],
};

// Supported Networks
export const SUPPORTED_NETWORKS = [BASE_MAINNET, BASE_SEPOLIA];

export const isBaseNetwork = (chainId: number | null) => {
  return chainId === BASE_MAINNET.id || chainId === BASE_SEPOLIA.id;
};

// Setup wallet event listeners
if (typeof window !== 'undefined' && (window as any).ethereum) {
  (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
    const store = useWalletStore.getState();
    if (accounts.length === 0) {
      store.disconnect();
    } else {
      store.setAddress(accounts[0]);
    }
  });

  (window as any).ethereum.on('chainChanged', (chainId: string) => {
    const store = useWalletStore.getState();
    store.setChainId(parseInt(chainId, 16));
  });

  (window as any).ethereum.on('disconnect', () => {
    const store = useWalletStore.getState();
    store.disconnect();
  });
}
