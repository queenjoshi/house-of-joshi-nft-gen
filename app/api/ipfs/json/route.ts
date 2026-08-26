import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, formatPinataResult, requirePinataJWT } from '@/lib/server/pinata';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_JSON_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const jwt = requirePinataJWT();
    const payload = await request.json();
    const name = typeof payload.name === 'string' ? payload.name.slice(0, 120) : 'metadata';
    const content = payload.content;

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'JSON metadata content is required.' }, { status: 400 });
    }
    const encoded = JSON.stringify(content);
    if (new TextEncoder().encode(encoded).byteLength > MAX_JSON_BYTES) {
      return NextResponse.json({ error: 'JSON metadata exceeds the 2 MB limit.' }, { status: 413 });
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: content,
        pinataMetadata: { name: `${name}.json` },
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.IpfsHash) {
      return NextResponse.json(
        { error: result.error?.details || result.error || 'Pinata JSON upload failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json(formatPinataResult(result.IpfsHash));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON upload failed.';
    const status = message.includes('not configured') ? 503 : message.includes('Cross-origin') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
