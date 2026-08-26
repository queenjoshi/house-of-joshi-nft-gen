import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, formatPinataResult, requirePinataJWT } from '@/lib/server/pinata';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_SUPPLY = 10_000;

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const jwt = requirePinataJWT();
    const payload = await request.json();
    const count = Number(payload.count);
    const metadata = payload.metadata;
    const collectionName = typeof payload.name === 'string' ? payload.name.slice(0, 100) : 'collection';

    if (!Number.isInteger(count) || count < 1 || count > MAX_SUPPLY) {
      return NextResponse.json({ error: `Supply must be between 1 and ${MAX_SUPPLY}.` }, { status: 400 });
    }
    if (!metadata || typeof metadata !== 'object') {
      return NextResponse.json({ error: 'Token metadata is required.' }, { status: 400 });
    }

    const body = new FormData();
    for (let tokenId = 0; tokenId < count; tokenId += 1) {
      const tokenMetadata = {
        ...metadata,
        name: `${collectionName} #${tokenId}`,
        edition: tokenId,
      };
      body.append(
        'file',
        new Blob([JSON.stringify(tokenMetadata)], { type: 'application/json' }),
        `${tokenId}.json`,
      );
    }
    body.append('pinataOptions', JSON.stringify({ wrapWithDirectory: true }));
    body.append('pinataMetadata', JSON.stringify({ name: `${collectionName}-metadata` }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body,
    });
    const result = await response.json();
    if (!response.ok || !result.IpfsHash) {
      return NextResponse.json(
        { error: result.error?.details || result.error || 'Metadata directory upload failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json(formatPinataResult(result.IpfsHash));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Metadata directory upload failed.';
    const status = message.includes('not configured') ? 503 : message.includes('Cross-origin') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
