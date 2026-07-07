// AI Layered NFT Generation Types and Functions

export interface Layer {
  id: string;
  url: string;
  zIndex: number;
}

export interface LayeredMetadata {
  name: string;
  description: string;
  composition: {
    layers: Layer[];
    blendMode: string;
  };
}

export interface AIGenerationRequest {
  prompt: string;
  collectionName: string;
  collectionSymbol: string;
  description: string;
  maxSupply: number;
  mintPrice: string;
  royaltyPercentage: number;
}

export interface AIGenerationResponse {
  success: boolean;
  imageUrl?: string;
  imageCID?: string | null;
  metadataUrl?: string;
  metadataCID?: string | null;
  error?: string;
}

export function ipfsToGatewayUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
}

function extractIpfsCID(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '').split('/')[0] || null;
  }

  const marker = '/ipfs/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return url.slice(markerIndex + marker.length).split('/')[0] || null;
}

function getEdgeFunctionUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  return `${supabaseUrl}/functions/v1/generate-layered-art`;
}

/**
 * Test Edge Function connectivity
 */
export async function testEdgeFunctionConnectivity(): Promise<{ success: boolean; error?: string }> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Testing connectivity to:', edgeFunctionUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(
      edgeFunctionUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'connectivity-test', dryRun: true }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log('Test response status:', response.status);
    const text = await response.text();
    console.log('Test response:', text);

    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${text}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Connectivity test error:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out - Edge Function not responding';
      } else if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error - Cannot reach Edge Function. Check if it is deployed.';
      } else {
        errorMessage = error.message;
      }
    }
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Call Supabase Edge Function to generate layered NFT
 */
export async function generateLayeredNFT(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Calling Edge Function at:', edgeFunctionUrl);
    console.log('Request:', request);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch(
      edgeFunctionUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', errorText);
      return { 
        success: false, 
        error: `Edge Function failed: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('Edge Function response:', data);

    if (data.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      imageUrl: ipfsToGatewayUrl(data.imageUrl || data.ipfsUrl),
      imageCID: data.imageCID || extractIpfsCID(data.imageUrl || data.ipfsUrl),
      metadataUrl: data.metadataUrl,
      metadataCID: data.metadataCID || extractIpfsCID(data.metadataUrl),
    };
  } catch (error) {
    console.error('AI generation error:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out - AI generation took too long' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Upload layered metadata to IPFS
 */
export async function uploadLayeredMetadataToIPFS(
  metadata: LayeredMetadata
): Promise<string> {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PINATA_JWT || ''}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}_layered.json`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata error: ${response.statusText}`);
  }

  const data = await response.json();
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}
