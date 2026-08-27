/**
 * Upload a file to IPFS via Pinata REST API
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ipfs/file', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as { gatewayUrl?: string; error?: string };
    if (!response.ok || !data.gatewayUrl) throw new Error(data.error || 'Pinata file upload failed.');
    return data.gatewayUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/** Convert a Pinata or public IPFS gateway URL into the canonical onchain URI. */
export function toIPFSUri(value: string): string {
  if (!value || value.startsWith('ipfs://')) return value;
  const match = value.match(/\/ipfs\/([^/?#]+)([^?#]*)/i);
  return match ? `ipfs://${match[1]}${match[2] || ''}` : value;
}

/** Convert an uploaded browser image into a permanent IPFS URL when needed. */
export async function publishImageToIPFS(value: string | null, filename: string) {
  if (!value) return { ipfsUri: '', gatewayUrl: '' };

  if (value.startsWith('data:')) {
    const gatewayUrl = await uploadFileToIPFS(dataURLtoFile(value, filename));
    return { ipfsUri: toIPFSUri(gatewayUrl), gatewayUrl };
  }

  if (value.startsWith('ipfs://')) {
    const cidPath = value.slice('ipfs://'.length);
    return {
      ipfsUri: value,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cidPath}`,
    };
  }

  return { ipfsUri: toIPFSUri(value), gatewayUrl: value };
}

/**
 * Upload JSON to IPFS via Pinata REST API
 */
export async function uploadJSONToIPFS(
  jsonObject: any,
  name: string
): Promise<string> {
  try {
    const response = await fetch('/api/ipfs/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: jsonObject,
        name,
      }),
    });

    const data = await response.json() as { gatewayUrl?: string; error?: string };
    if (!response.ok || !data.gatewayUrl) throw new Error(data.error || 'Pinata JSON upload failed.');
    return data.gatewayUrl;
  } catch (error) {
    console.error('JSON upload error:', error);
    throw error;
  }
}

export async function uploadMetadataDirectory({
  name,
  count,
  metadata,
}: {
  name: string;
  count: number;
  metadata: Record<string, unknown>;
}): Promise<{ baseURI: string; gatewayUrl: string }> {
  const response = await fetch('/api/ipfs/metadata-directory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, count, metadata }),
  });
  const data = await response.json() as { ipfsUri?: string; gatewayUrl?: string; error?: string };
  if (!response.ok || !data.ipfsUri || !data.gatewayUrl) {
    throw new Error(data.error || 'Metadata directory upload failed.');
  }
  return {
    baseURI: `${data.ipfsUri.replace(/\/$/, '')}/`,
    gatewayUrl: `${data.gatewayUrl.replace(/\/$/, '')}/`,
  };
}

/**
 * Convert data URL to File
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
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
