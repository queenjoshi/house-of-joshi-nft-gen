export interface Layer {
  id: string;
  name: string;
  order: number;
  traits: Trait[];
  isRequired: boolean;
}

export interface Trait {
  id: string;
  name: string;
  file: File | null;
  preview: string;
  rarity: number;
}

export interface CollectionDetails {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  mintPrice: string;
  royaltyPercentage: number;
  bannerImage: string | null;
  coverImage: string | null;
}

/**
 * Upload a file to IPFS via Pinata REST API
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT || ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Upload JSON to IPFS via Pinata REST API
 */
export async function uploadJSONToIPFS(
  jsonObject: any,
  name: string
): Promise<string> {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT || ''}`,
      },
      body: JSON.stringify({
        pinataContent: jsonObject,
        pinataMetadata: {
          name: `${name}.json`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  } catch (error) {
    console.error('JSON upload error:', error);
    throw error;
  }
}

/**
 * Generate and upload collection metadata to IPFS
 */
export async function generateAndUploadCollectionMetadata(
  collectionDetails: CollectionDetails,
  layers: Layer[],
  creatorAddress: string,
  nftCount: number = 100
): Promise<{
  contractURI: string;
  baseURI: string;
  totalGenerated: number;
}> {
  try {
    console.log('Uploading collection metadata to IPFS...');

    // Upload cover image if provided
    let coverImageUrl = '';
    if (collectionDetails.coverImage) {
      try {
        const coverFile = dataURLtoFile(collectionDetails.coverImage, 'cover.png');
        coverImageUrl = await uploadFileToIPFS(coverFile);
      } catch (e) {
        console.warn('Cover upload failed:', e);
      }
    }

    // Upload banner image if provided
    let bannerImageUrl = '';
    if (collectionDetails.bannerImage) {
      try {
        const bannerFile = dataURLtoFile(collectionDetails.bannerImage, 'banner.png');
        bannerImageUrl = await uploadFileToIPFS(bannerFile);
      } catch (e) {
        console.warn('Banner upload failed:', e);
      }
    }

    // Create contract metadata
    const contractMetadata = {
      name: collectionDetails.name,
      description: collectionDetails.description,
      image: coverImageUrl,
      banner_image: bannerImageUrl,
      external_link: 'https://thehouseofjoshi.com',
      seller_fee_basis_points: collectionDetails.royaltyPercentage * 100,
      fee_recipient: creatorAddress,
    };

    // Upload contract metadata
    const contractURI = await uploadJSONToIPFS(contractMetadata, `${collectionDetails.symbol}_contract`);

    // Generate sample NFT metadata
    const nftMetadata = [];
    const count = Math.min(nftCount, collectionDetails.maxSupply, 10); // Limit to 10 for demo

    for (let i = 1; i <= count; i++) {
      nftMetadata.push({
        name: `${collectionDetails.name} #${i}`,
        description: collectionDetails.description,
        image: 'ipfs://QmPlaceholder', // Placeholder
        attributes: [
          { trait_type: 'Edition', value: `${i}/${count}` },
        ],
      });
    }

    // Upload first NFT metadata as base
    const baseMetadataUrl = await uploadJSONToIPFS(nftMetadata[0], '1');
    const baseURI = baseMetadataUrl.replace('/1.json', '/');

    console.log('Metadata upload complete');
    console.log('Contract URI:', contractURI);
    console.log('Base URI:', baseURI);

    return {
      contractURI,
      baseURI,
      totalGenerated: count,
    };
  } catch (error) {
    console.error('Metadata generation failed:', error);
    throw error;
  }
}

/**
 * Convert data URL to File
 */
function dataURLtoFile(dataurl: string, filename: string): File {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('DataURL conversion error:', error);
    throw error;
  }
}
