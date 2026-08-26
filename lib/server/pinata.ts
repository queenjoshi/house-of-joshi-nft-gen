import { NextRequest } from 'next/server';

const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export function requirePinataJWT() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT is not configured on the server.');
  return jwt;
}
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : requestOrigin;

  if (origin !== requestOrigin && origin !== configuredOrigin) {
    throw new Error('Cross-origin uploads are not allowed.');
  }
}

export function formatPinataResult(cid: string) {
  const gateway = (process.env.PINATA_GATEWAY || DEFAULT_GATEWAY).replace(/\/$/, '');
  return {
    cid,
    ipfsUri: `ipfs://${cid}`,
    gatewayUrl: `${gateway}/${cid}`,
  };
}
