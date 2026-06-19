// Database types
export interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  twitter_handle: string | null;
  farcaster_handle: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  contract_address: string | null;
  creator_id: string | null;
  name: string;
  symbol: string;
  description: string | null;
  banner_url: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  featured_image_url: string | null;
  external_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  base_uri: string | null;
  max_supply: number;
  mint_price_eth: number;
  mint_price_wei: string;
  mint_start_time: string | null;
  mint_end_time: string | null;
  royalty_percentage: number;
  royalty_recipient: string | null;
  is_verified: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_public: boolean;
  status: 'draft' | 'generating' | 'uploading' | 'deploying' | 'verifying' | 'live' | 'paused' | 'ended';
  deployment_tx_hash: string | null;
  verification_tx_hash: string | null;
  ipfs_images_cid: string | null;
  ipfs_metadata_cid: string | null;
  total_unique_traits: number;
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
  verified_at: string | null;
}

export interface Layer {
  id: string;
  collection_id: string;
  name: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface Trait {
  id: string;
  layer_id: string;
  name: string;
  image_url: string | null;
  ipfs_cid: string | null;
  rarity_weight: number;
  is_unique: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NFT {
  id: string;
  collection_id: string;
  token_id: number | null;
  dna: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  ipfs_image_cid: string | null;
  metadata_url: string | null;
  ipfs_metadata_cid: string | null;
  attributes: NFTAttribute[];
  rarity_rank: number | null;
  rarity_score: number | null;
  is_minted: boolean;
  minter_address: string | null;
  minted_at: string | null;
  mint_tx_hash: string | null;
  created_at: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
  rarity?: number;
}

export interface MintTransaction {
  id: string;
  collection_id: string;
  nft_id: string | null;
  wallet_address: string;
  token_id: number | null;
  quantity: number;
  tx_hash: string | null;
  amount_eth: number | null;
  amount_wei: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  referral_wallet: string | null;
  estimated_gas: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface AnalyticsEvent {
  id: string;
  collection_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  wallet_address: string | null;
  referral_wallet: string | null;
  created_at: string;
}

// UI Types
export interface CollectionStats {
  totalSupply: number;
  minted: number;
  uniqueHolders: number;
  floorPrice: number;
  totalVolume: number;
}

export interface CreatorStats {
  totalCollections: number;
  totalNFTsMinted: number;
  totalVolume: number;
  totalRoyalties: number;
  uniqueCollectors: number;
}

// Web3 Types
export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
}

// Generator Types
export interface LayerUpload {
  id: string;
  name: string;
  files: TraitUpload[];
  order: number;
  isRequired: boolean;
}

export interface TraitUpload {
  id: string;
  name: string;
  file: File | null;
  preview: string;
  rarityWeight: number;
}

export interface GeneratedNFT {
  id: string;
  dna: string;
  image: string;
  attributes: NFTAttribute[];
  rarityScore: number;
}

// Form Types
export interface CreateCollectionForm {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  mintPrice: string;
  royaltyPercentage: number;
  bannerFile: File | null;
  bannerPreview: string | null;
  coverFile: File | null;
  coverPreview: string | null;
  logoFile: File | null;
  logoPreview: string | null;
  externalUrl: string;
  twitterUrl: string;
  discordUrl: string;
}
