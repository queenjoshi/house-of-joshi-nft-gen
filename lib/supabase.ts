import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type UntypedSupabaseClient = SupabaseClient<any>;

let supabaseClient: UntypedSupabaseClient | null = null;

function getSupabaseClient(): UntypedSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient<any>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export const supabase = new Proxy({} as UntypedSupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  },
});

// Helper functions for database operations
export async function getUser(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function createUser(walletAddress: string, userData?: Partial<{
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  twitter_handle: string;
  farcaster_handle: string;
  website_url: string;
}>) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      wallet_address: walletAddress,
      ...userData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertUser(walletAddress: string, userData?: Partial<{
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  twitter_handle: string;
  farcaster_handle: string;
  website_url: string;
}>) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      wallet_address: walletAddress,
      ...userData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(walletAddress: string, updates: Partial<{
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  twitter_handle: string;
  farcaster_handle: string;
  website_url: string;
}>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Collection functions
export async function getCollections(options?: {
  status?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  creatorId?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('collections')
    .select(`
      *,
      users:creator_id (
        wallet_address,
        username,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.isFeatured) {
    query = query.eq('is_featured', true);
  }
  if (options?.isTrending) {
    query = query.eq('is_trending', true);
  }
  if (options?.creatorId) {
    query = query.eq('creator_id', options.creatorId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCollectionByAddress(contractAddress: string) {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      users:creator_id (
        id,
        wallet_address,
        username,
        avatar_url,
        banner_url,
        bio
      )
    `)
    .eq('contract_address', contractAddress)
    .single();

  if (error) throw error;
  return data;
}

export async function createCollection(collection: {
  creator_id: string;
  name: string;
  symbol: string;
  description?: string;
  max_supply: number;
  mint_price_eth: number;
  mint_price_wei_wei: string;
  royalty_percentage: number;
  royalty_recipient?: string;
  banner_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  contract_address?: string;
  deployment_tx_hash?: string;
  is_public?: boolean;
  is_verified?: boolean;
  status?: string;
  deployed_at?: string;
  external_url?: string;
  twitter_url?: string;
  discord_url?: string;
}) {
  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSupabaseCollection(collection: {
  creator_id: string;
  contract_address: string;
  name: string;
  symbol: string;
  description?: string;
  max_supply: number;
  mint_price_eth: number;
  mint_price_wei_wei: string;
  royalty_percentage: number;
  royalty_recipient?: string;
  banner_url?: string;
  cover_image_url?: string;
  deployment_tx_hash?: string;
  is_public?: boolean;
  is_verified?: boolean;
  status?: string;
  deployed_at?: string;
  external_url?: string;
  twitter_url?: string;
  discord_url?: string;
}) {
  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCollectionByAddress(contractAddress: string, updates: {
  description?: string;
  external_url?: string;
  twitter_url?: string;
  discord_url?: string;
  is_verified?: boolean;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('contract_address', contractAddress)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Layer and Trait functions
export async function getLayers(collectionId: string) {
  const { data, error } = await supabase
    .from('layers')
    .select(`
      *,
      traits (*)
    `)
    .eq('collection_id', collectionId)
    .order('order_index');

  if (error) throw error;
  return data;
}

export async function createLayer(collectionId: string, layer: {
  name: string;
  order_index: number;
  is_required?: boolean;
}) {
  const { data, error } = await supabase
    .from('layers')
    .insert({
      collection_id: collectionId,
      ...layer,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createTrait(layerId: string, trait: {
  name: string;
  image_url?: string;
  rarity_weight?: number;
  is_unique?: boolean;
}) {
  const { data, error } = await supabase
    .from('traits')
    .insert({
      layer_id: layerId,
      ...trait,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// NFT functions
export async function getNFTs(collectionId: string, options?: {
  isMinted?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('nfts')
    .select('*')
    .eq('collection_id', collectionId)
    .order('token_id');

  if (options?.isMinted !== undefined) {
    query = query.eq('is_minted', options.isMinted);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createNFTs(nfts: {
  collection_id: string;
  dna: string;
  name?: string;
  description?: string;
  image_url?: string;
  attributes: Record<string, unknown>[];
  rarity_score?: number;
}[]) {
  const { data, error } = await supabase
    .from('nfts')
    .insert(nfts)
    .select();

  if (error) throw error;
  return data;
}

// Analytics functions
export async function trackEvent(event: {
  collection_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  wallet_address?: string;
  referral_wallet?: string;
}) {
  const { error } = await supabase
    .from('analytics_events')
    .insert(event);

  if (error) console.error('Analytics error:', error);
}

export async function getCollectionAnalytics(collectionId: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('collection_id', collectionId);

  if (error) throw error;
  return data;
}

// Mint transaction functions
export async function createMintTransaction(transaction: {
  collection_id: string;
  wallet_address: string;
  quantity?: number;
  amount_eth?: number;
  amount_wei?: string;
  referral_wallet?: string;
}) {
  const { data, error } = await supabase
    .from('mint_transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMintTransaction(id: string, updates: {
  tx_hash?: string;
  token_id?: number;
  status?: string;
  confirmed_at?: string;
}) {
  const { data, error } = await supabase
    .from('mint_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Referral functions
export async function getReferralStats(collectionId: string, referrerWallet: string) {
  const { data, error } = await supabase
    .from('referral_stats')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('referrer_wallet', referrerWallet)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}
