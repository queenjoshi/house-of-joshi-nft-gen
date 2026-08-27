import { isAddress, verifyMessage } from 'viem';

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

export type PreviewSignaturePayload = {
  walletAddress: string;
  prompt: string;
  nonce: string;
  issuedAt: string;
  signature: `0x${string}`;
};

/** The exact message a connected wallet must sign before an AI preview is generated. */
export function createPreviewAuthorizationMessage({
  walletAddress,
  prompt,
  nonce,
  issuedAt,
}: Omit<PreviewSignaturePayload, 'signature'>) {
  return [
    'House of Joshi AI Preview',
    `Wallet: ${walletAddress.toLowerCase()}`,
    `Prompt: ${prompt}`,
    `Nonce: ${nonce}`,
    `Issued at: ${issuedAt}`,
  ].join('\n');
}

export async function verifyPreviewAuthorization(payload: PreviewSignaturePayload) {
  if (!isAddress(payload.walletAddress)) return false;
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(payload.nonce)) return false;

  const issuedAt = Date.parse(payload.issuedAt);
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > MAX_SIGNATURE_AGE_MS) {
    return false;
  }

  try {
    return await verifyMessage({
      address: payload.walletAddress,
      message: createPreviewAuthorizationMessage(payload),
      signature: payload.signature,
    });
  } catch {
    return false;
  }
}
